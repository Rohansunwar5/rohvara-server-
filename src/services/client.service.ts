import cluster from 'cluster';
import bcrypt from 'bcrypt';
import { NotFoundError } from '../errors/not-found.error';
import { UnauthorizedError } from '../errors/unauthorized.error';
import { CommandQueueRepository } from '../repository/commandQueue.repository';
import { DeviceRepository } from '../repository/device.repository';
import { PlayerRepository } from '../repository/player.repository';
import { SessionRepository } from '../repository/session.repository';
import { DeviceStatus } from '../models/device.model';
import { BadRequestError } from '../errors/bad-request.error';
import { CommandType } from '../models/commandQueue.model';
import { EndedBy, SessionStatus } from '../models/session.model';
import logger from '../utils/logger';
import { TransactionType } from '../models/transaction.model';
import { TransactionRepository } from '../repository/transaction.repository';
import { SuperUserRepository } from '../repository/superUser.repository';
import SessionQueueService from './queue/sessionQueue.service';

class ClientService {
    constructor (
        private readonly _playerRepository: PlayerRepository,
        private readonly _deviceRepository: DeviceRepository,
        private readonly _sessionRepository: SessionRepository,
        private readonly _commandQueueRepository: CommandQueueRepository,
        private readonly _transactionRepository: TransactionRepository,
        private readonly _superUserRepository: SuperUserRepository,
        private readonly _sessionQueueService: SessionQueueService
    ) {}

    async authenticatePlayer(params: { pcId: string, username: string, password: string }) {
        const { pcId, username, password } = params;

        const device = await this._deviceRepository.getDeviceByPcId('', pcId);
        if(!device) throw new NotFoundError('Pc not registered');

        const loungeId = device.lounge_id;

        if (device.status !== DeviceStatus.AVAILABLE) {
            throw new BadRequestError('PC is not available');
        }

        const player = await this._playerRepository.getPlayerByUsername(loungeId, username);
        if (!player) throw new NotFoundError('Invalid username or password');

        if (player.status !== 'active') {
            throw new UnauthorizedError('Player account is not active');
        }

        const isPasswordValid = await bcrypt.compare(password, player.password);
        if (!isPasswordValid) throw new UnauthorizedError('Invalid username or password');

        if (player.credit_balance <= 0) {
            throw new BadRequestError('Insufficient credits. Please contact staff.');
        }

        const existingSession = await this._sessionRepository.getActiveSessionByPlayer(loungeId, player._id);
        if (existingSession) {
            throw new BadRequestError('Player already has an active session on another PC');
        }

        const existingDeviceSession = await this._sessionRepository.getActiveSessionByDevice(loungeId, device._id);
        if (existingDeviceSession) {
            throw new BadRequestError('PC already has an active session');
        }

        const sessionMinutes = Math.min(player.credit_balance, 120);

        const deductedPlayer = await this._playerRepository.deductCredits(loungeId, player._id, sessionMinutes);
        if (!deductedPlayer) {
            throw new BadRequestError('Failed to deduct credits');
        }

        const superUser = await this._superUserRepository.getSuperUserById(loungeId);

        const now = new Date();
        const sessionEndTime = new Date(now.getTime() + (sessionMinutes * 60 * 1000));
        const warningMinute = superUser?.settings?.session_warning_minutes || 5;
        const warningTime = new Date(sessionEndTime.getTime() - (warningMinute * 60 * 1000));

        // console.log('🎮 Creating session document...');
        const session = await this._sessionRepository.createSession(loungeId, {
            player_id: player._id,
            device_id: device._id,
            pc_id: device.pc_id,
            player_username: player.username,
            allocated_minutes: sessionMinutes,
            credits_used: sessionMinutes,
            remaining_minutes: sessionMinutes,
            session_end_time: sessionEndTime,
            warning_time: warningTime
        });
        // console.log('✅ Session created:', session._id);

        await this._deviceRepository.updateDeviceStatus(loungeId, {
            device_id: device._id,
            status: DeviceStatus.IN_USE,
            current_user_id: player._id,
            current_session_id: session._id
        });

        await this._transactionRepository.createTransaction(loungeId, {
            player_id: player._id,
            player_username: player.username,
            type: TransactionType.CREDIT_DEDUCTION,
            amount: sessionMinutes,
            description: `Session started on ${device.pc_name}`,
            session_id: session._id,
            created_by_id: player._id
        });


        const warningMinutes = superUser?.settings?.session_warning_minutes || 5;

        await this._sessionQueueService.scheduleSessionExpiry({
            sessionId: session._id,
            loungeId,
            playerId: player._id,
            deviceId: device._id,
            pcId: device.pc_id,
            playerUsername: player.username,
            allocatedMinutes: sessionMinutes,
            warningMinutes
        });

        await this._playerRepository.updateLastLogin(loungeId, player._id);

        // Create START_SESSION command for PC
        // console.log('🎮 Creating START_SESSION command...');
        // const command = await this._commandQueueRepository.createCommand(loungeId, {
        //     pc_id: pcId,
        //     command: CommandType.START_SESSION,
        //     data: {
        //         player_id: player._id,
        //         session_id: session._id,
        //         allocated_minutes: sessionMinutes,
        //         message: `Welcome ${player.display_name || player.username}!`
        //     },
        //     created_by_id: player._id
        // });
        // console.log('✅ START_SESSION command created:', command._id);


        return {
            success: true,
            player: {
                id: player._id,
                username: player.username,
                display_name: player.display_name,
                credit_balance: deductedPlayer.credit_balance
            },
            device: {
                id: device._id,
                pc_id: device.pc_id,
                pc_name: device.pc_name
            },
            session: {
                id: session._id,
                allocated_minutes: sessionMinutes,
                remaining_minutes: sessionMinutes,
                status: session.status,
                session_end_time: sessionEndTime.toISOString(),
                warning_time: warningTime.toISOString()
            },
            message: 'Authentication successful. Session will start shortly.'
        };
    }

    async checkCommands(params: { pcId: string }) {
        const { pcId } = params;

        const device = await this._deviceRepository.getDeviceByPcId('', pcId);
        if (!device) throw new NotFoundError('PC not registered');

        const loungeId = device.lounge_id;
        // console.log(`🔍 Checking commands for PC: ${pcId}, lounge: ${loungeId}`);

        // Update heartbeat
        await this._deviceRepository.updateHeartbeat(loungeId, pcId);

        // Get pending commands for this PC
        const commands = await this._commandQueueRepository.getPendingCommands(loungeId, pcId);
        // console.log(`📋 Found ${commands.length} pending commands for ${pcId}`);

        if (commands.length === 0) {
            return {
                commands: [],
                pc_status: device.status,
                timestamp: new Date().toISOString()
            };
        }

        // console.log('📋 Commands found:', commands.map(cmd => ({ id: cmd._id, command: cmd.command })));

        const commandIds = commands.map(cmd => cmd._id);
        await this._commandQueueRepository.markCommandsAsExecuted(loungeId, commandIds);
        // console.log('✅ Marked commands as executed:', commandIds);


        return {
            commands: commands.map(command => ({
                id: command._id,
                command: command.command,
                data: command.data,
                created_at: command.createdAt
            })),
            pc_status: device.status,
            timestamp: new Date().toISOString()
        };
    }

    async updateStatus(params: { pcId: string, status: string, currentSessionTime?: number, gameLaunched?: string }) {
        const { pcId, status, currentSessionTime, gameLaunched } = params;

        // Get device to find lounge
        const device = await this._deviceRepository.getDeviceByPcId('', pcId);
        if (!device) throw new NotFoundError('PC not registered');

        const loungeId = device.lounge_id;

        // Convert status to enum
        let deviceStatus: DeviceStatus;
        if (status === 'available') deviceStatus = DeviceStatus.AVAILABLE;
        else if (status === 'in_use') deviceStatus = DeviceStatus.IN_USE;
        else if (status === 'offline') deviceStatus = DeviceStatus.OFFLINE;
        else if (status === 'maintenance') deviceStatus = DeviceStatus.MAINTENANCE;
        else throw new BadRequestError('Invalid status');

        // Update device status
        await this._deviceRepository.updateDeviceStatus(loungeId, {
            device_id: device._id,
            status: deviceStatus,
            current_user_id: device.current_user_id,
            current_session_id: device.current_session_id
        });

        // If there's an active session, update session info
        if (device.current_session_id) {
            const session = await this._sessionRepository.getSessionById(loungeId, device.current_session_id);

            if (session && session.status === SessionStatus.ACTIVE) {
                // Handle session time update
                const hasValidSessionTime = typeof currentSessionTime === 'number' && currentSessionTime >= 0;
                if (hasValidSessionTime) {
                    await this._sessionRepository.updateSessionTime(
                        loungeId,
                        session._id,
                        currentSessionTime as number
                    );
                }

                // Handle game launched update
                const hasGameLaunched = typeof gameLaunched === 'string' && gameLaunched.length > 0;
                if (hasGameLaunched) {
                    await this._sessionRepository.updateSession(loungeId, {
                        _id: session._id,
                        game_launched: gameLaunched as string
                    });
                }

                // Check if session expired
                const isSessionExpired = typeof currentSessionTime === 'number' && currentSessionTime <= 0;
                if (isSessionExpired) {
                    await this._sessionRepository.endSession(
                        loungeId,
                        session._id,
                        EndedBy.TIMEOUT,
                        'Session expired - time ran out'
                    );

                    // Create END_SESSION command
                    await this._commandQueueRepository.createCommand(loungeId, {
                        pc_id: pcId,
                        command: CommandType.END_SESSION,
                        data: {
                            session_id: session._id,
                            message: 'Your session has expired. Thank you for playing!'
                        },
                        created_by_id: session.player_id
                    });
                }
            }
        }

        return {
            success: true,
            pc_id: pcId,
            status: deviceStatus,
            timestamp: new Date().toISOString()
        };
    }

    async updateHeartbeat(params: { pcId: string }) {
        const { pcId } = params;

        const device = await this._deviceRepository.getDeviceByPcId('', pcId);
        if(!device) throw new NotFoundError('Pc not registered');

        const loungeId = device.lounge_id;

        await this._deviceRepository.updateHeartbeat(loungeId, pcId);

        return {
            success: true,
            pc_id: pcId,
            timestamp: new Date().toISOString(),
            status: 'heartbeat_updated'
        };
    }

    async sessionLogout(params: { pcId: string; sessionId: string }) {
        const { pcId, sessionId } = params;

        // Get device to find lounge
        const device = await this._deviceRepository.getDeviceByPcId('', pcId);
        if (!device) throw new NotFoundError('PC not registered');

        const loungeId = device.lounge_id;

        // Get session
        const session = await this._sessionRepository.getSessionById(loungeId, sessionId);
        if (!session) throw new NotFoundError('Session not found');

        if (session.status !== SessionStatus.ACTIVE) {
            throw new BadRequestError('Session is not active');
        }

        // End session
        await this._sessionRepository.endSession(
            loungeId,
            sessionId,
            EndedBy.PLAYER,
            'Player logged out'
        );

        // Update device status
        await this._deviceRepository.updateDeviceStatus(loungeId, {
            device_id: device._id,
            status: DeviceStatus.AVAILABLE,
            current_user_id: null,
            current_session_id: null
        });

        return {
            success: true,
            message: 'Session ended successfully',
            pc_id: pcId,
            timestamp: new Date().toISOString()
        };
    }

    async reportError(params: {
        pcId: string;
        errorType: string;
        errorMessage: string;
        sessionId?: string;
    }) {
        const { pcId, errorType, errorMessage, sessionId } = params;

        // Get device to find lounge
        const device = await this._deviceRepository.getDeviceByPcId('', pcId);
        if (!device) throw new NotFoundError('PC not registered');

        const loungeId = device.lounge_id;

        // Log error (you might want to create an ErrorLog model for this)
        logger.error(`PC Error - ${pcId}:`, {
            type: errorType,
            message: errorMessage,
            sessionId: sessionId || null,
            timestamp: new Date().toISOString()
        });

        // If it's a critical error, mark PC as maintenance
        if (errorType === 'critical' || errorType === 'hardware') {
            await this._deviceRepository.updateDeviceStatus(loungeId, {
                device_id: device._id,
                status: DeviceStatus.MAINTENANCE,
                current_user_id: null,
                current_session_id: null
            });

            // If there's an active session, end it
            if (sessionId) {
                await this._sessionRepository.endSession(
                    loungeId,
                    sessionId,
                    EndedBy.SYSTEM,
                    `System error: ${errorMessage}`
                );
            }
        }

        return {
            success: true,
            message: 'Error reported successfully',
            pc_id: pcId,
            timestamp: new Date().toISOString()
        };
    }
}

const sessionQueueService = new SessionQueueService(
    new SessionRepository(),
    new DeviceRepository(),
    new CommandQueueRepository(),
    new TransactionRepository(),
    new PlayerRepository()
);

setImmediate(async () => {
    try {
        if (cluster.isWorker && cluster.worker?.id === 1) {
            await sessionQueueService.initialize();
            logger.info('SessionQueueService initialized on worker 1');
        } else if (!cluster.isMaster && !cluster.isWorker) {
            await sessionQueueService.initialize();
            logger.info('SessionQueueService initialized in non-clustered mode');
        }
    } catch (error) {
        logger.error('Failed to initialize SessionQueueService:', error);
    }
});

export default new ClientService(
    new PlayerRepository(),
    new DeviceRepository(),
    new SessionRepository(),
    new CommandQueueRepository(),
    new TransactionRepository(),
    new SuperUserRepository(),
    sessionQueueService
);