import cluster from 'cluster';
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import { CommandType } from '../models/commandQueue.model';
import { DeviceStatus } from '../models/device.model';
import { EndedBy, SessionStatus } from '../models/session.model';
import { TransactionType } from '../models/transaction.model';
import { CommandQueueRepository } from '../repository/commandQueue.repository';
import { DeviceRepository } from '../repository/device.repository';
import { PlayerRepository } from '../repository/player.repository';
import { ICreateSessionParams, IUpdateSessionParams, SessionRepository } from '../repository/session.repository';
import { SuperUserRepository } from '../repository/superUser.repository';
import { TransactionRepository } from '../repository/transaction.repository';
import logger from '../utils/logger';
import SessionQueueService from './queue/sessionQueue.service';

class SessionService {
    constructor(
        private readonly _sessionRepository: SessionRepository,
        private readonly _playerRepository: PlayerRepository,
        private readonly _deviceRepository: DeviceRepository,
        private readonly _transactionRepository: TransactionRepository,
        private readonly _commandQueueRepository: CommandQueueRepository,
        private readonly _superUserRepository: SuperUserRepository,
        private readonly _sessionQueueService: SessionQueueService,
    ) {}

    async startSession(params: { loungeId: string, playerId: string, deviceId: string, minutes: number }) {
        const { loungeId, playerId, deviceId, minutes } = params;

        const player = await this._playerRepository.getPlayerById(loungeId, playerId);
        if(!player) throw new NotFoundError('Player not found');

        if(player.credit_balance < minutes) {
            throw new BadRequestError('Insufficient credits');
        }

        const device = await this._deviceRepository.getDeviceById(loungeId, deviceId);
        if(!device) throw new NotFoundError('Device not found');

        if (device.status !== DeviceStatus.AVAILABLE) {
            throw new BadRequestError('Device is not available');
        }

        // Check if player already has an active session
        const existingSession = await this._sessionRepository.getActiveSessionByPlayer(loungeId, playerId);
        if (existingSession) {
            throw new BadRequestError('Player already has an active session');
        }

        // Check if device already has an active session
        const existingDeviceSession = await this._sessionRepository.getActiveSessionByDevice(loungeId, deviceId);
        if (existingDeviceSession) {
            throw new BadRequestError('Device already has an active session');
        }

        // Deduct credits from player
        const deductedPlayer = await this._playerRepository.deductCredits(loungeId, playerId, minutes);
        if (!deductedPlayer) {
            throw new BadRequestError('Failed to deduct credits');
        }

        const superUser = await this._superUserRepository.getSuperUserById(loungeId);
        const warningMinute = superUser?.settings?.session_warning_minutes || 5;

        // Calculate end times
        const now = new Date();
        const sessionEndTime = new Date(now.getTime() + (minutes * 60 * 1000));
        const warningTime = new Date(sessionEndTime.getTime() - (warningMinute * 60 * 1000));

        // Create session params with end times
        const sessionParams: ICreateSessionParams = {
            player_id: playerId,
            device_id: deviceId,
            pc_id: device.pc_id,
            player_username: player.username,
            allocated_minutes: minutes,
            credits_used: minutes,
            remaining_minutes: minutes,
            session_end_time: sessionEndTime, // ADD THIS
            warning_time: warningTime // ADD THIS
        };

        // Create session
        const session = await this._sessionRepository.createSession(loungeId, sessionParams);

        // Update device status
        await this._deviceRepository.updateDeviceStatus(loungeId, {
            device_id: deviceId,
            status: DeviceStatus.IN_USE,
            current_user_id: playerId,
            current_session_id: session._id
        });

        await this._commandQueueRepository.createCommand(loungeId, {
            pc_id: device.pc_id,
            command: CommandType.START_SESSION,
            data: {
                player_id: playerId,
                session_id: session._id,
                allocated_minutes: minutes,
                message: `Session started for ${player.username}`
            },
            created_by_id: playerId
        });

        // Create transaction record
        await this._transactionRepository.createTransaction(loungeId, {
            player_id: playerId,
            player_username: player.username,
            type: TransactionType.CREDIT_DEDUCTION,
            amount: minutes,
            description: `Session started on ${device.pc_name}`,
            session_id: session._id,
            created_by_id: playerId
        });

        // const superUser = await this._superUserRepository.getSuperUserById(loungeId);
        const warningMinutes = superUser?.settings?.session_warning_minutes || 5;

        await this._sessionQueueService.scheduleSessionExpiry({
            sessionId: session._id,
            loungeId,
            playerId,
            deviceId,
            pcId: device.pc_id,
            playerUsername: player.username,
            allocatedMinutes: minutes,
            warningMinutes
        });

        return {
            session: {
                id: session._id,
                player_id: session.player_id,
                player_username: session.player_username,
                device_id: session.device_id,
                pc_id: session.pc_id,
                allocated_minutes: session.allocated_minutes,
                remaining_minutes: session.remaining_minutes,
                status: session.status,
                session_end_time: sessionEndTime.toISOString(),
                warning_time: warningTime.toISOString(),
                createdAt: session.createdAt
            },
            player: {
                id: deductedPlayer._id,
                username: deductedPlayer.username,
                credit_balance: deductedPlayer.credit_balance
            },
            device: {
                id: device._id,
                pc_id: device.pc_id,
                pc_name: device.pc_name,
                status: DeviceStatus.IN_USE
            }
        };
    }

    async extendSession(params: { loungeId: string, sessionId: string, additionalMinutes: number, createdById: string }) {
        const { loungeId, sessionId, additionalMinutes, createdById } = params;

        const session = await this._sessionRepository.getSessionById(loungeId, sessionId);
        if (!session) throw new NotFoundError('Session not found');

        if (session.status !== SessionStatus.ACTIVE) {
            throw new BadRequestError('Session is not active');
        }

        const player = await this._playerRepository.getPlayerById(loungeId, session.player_id);
        if (!player) throw new NotFoundError('Player not found');

        if (player.credit_balance < additionalMinutes) {
            throw new BadRequestError('Insufficient credits to extend session');
        }

        const deductedPlayer = await this._playerRepository.deductCredits(
            loungeId,
            session.player_id,
            additionalMinutes
        );

        if (!deductedPlayer) throw new BadRequestError('Failed to deduct credits');

        const newRemainingMinutes = session.remaining_minutes + additionalMinutes;
        const newAllocatedMinutes = session.allocated_minutes + additionalMinutes;

        const updateParams: IUpdateSessionParams = {
            _id: sessionId,
            remaining_minutes: newRemainingMinutes
        };

        const updatedSession = await this._sessionRepository.updateSession(loungeId, updateParams);
        if (!updatedSession) throw new BadRequestError('Failed to extend session');

        await this._transactionRepository.createTransaction(loungeId, {
            player_id: session.player_id,
            player_username: session.player_username,
            type: TransactionType.CREDIT_DEDUCTION,
            amount: additionalMinutes,
            description: `Session extended by ${additionalMinutes} minutes`,
            session_id: sessionId,
            created_by_id: createdById
        });

        const superUser = await this._superUserRepository.getSuperUserById(loungeId);
        const warningMinutes = superUser?.settings?.session_warning_minutes || 5;

        await this._sessionQueueService.extendSessionSchedule({
            sessionId,
            loungeId,
            additionalMinutes,
            totalRemainingMinutes: newRemainingMinutes,
            pcId: session.pc_id,
            playerUsername: session.player_username,
            warningMinutes
        });

        return {
            session: {
                id: updatedSession._id,
                allocated_minutes: newAllocatedMinutes,
                remaining_minutes: updatedSession.remaining_minutes,
                credits_used: updatedSession.credits_used + additionalMinutes
            },
            player: {
                id: deductedPlayer._id,
                credit_balance: deductedPlayer.credit_balance
            }
        };
    }

    async endSession(params: { loungeId: string, sessionId: string, endedBy: string, notes?: string }) {
        const { loungeId, sessionId, endedBy, notes } = params;

        const session = await this._sessionRepository.getSessionById(loungeId, sessionId);
        if(!session) throw new NotFoundError('Session not found');

        if(session.status !== SessionStatus.ACTIVE) {
            throw new BadRequestError('Session is not active');
        }

        let sessionEndedBy: EndedBy;
        if (endedBy === 'player') sessionEndedBy = EndedBy.PLAYER;
        else if (endedBy === 'superuser') sessionEndedBy = EndedBy.SUPERUSER;
        else if (endedBy === 'timeout') sessionEndedBy = EndedBy.TIMEOUT;
        else if (endedBy === 'system') sessionEndedBy = EndedBy.SYSTEM;
        else throw new BadRequestError('Invalid ended_by value');

        const endedSession = await this._sessionRepository.endSession(
            loungeId,
            sessionId,
            sessionEndedBy,
            notes
        );

        if(!endedSession) throw new BadRequestError('Failed to end session');

        await this._sessionQueueService.cancelSessionJobs(sessionId);

        await this._deviceRepository.updateDeviceStatus(loungeId, {
            device_id: session.device_id,
            status: DeviceStatus.AVAILABLE,
            current_user_id: null,
            current_session_id: null
        });

        await this._commandQueueRepository.createCommand(loungeId, {
            pc_id: session.pc_id,
            command: CommandType.END_SESSION,
            data: {
                session_id: sessionId,
                message: notes || 'Session ended by administrator'
            },
            created_by_id: session.player_id
        });

        return {
            session: {
                id: endedSession._id,
                player_id: endedSession.player_id,
                player_username: endedSession.player_username,
                pc_id: endedSession.pc_id,
                allocated_minutes: endedSession.allocated_minutes,
                remaining_minutes: endedSession.remaining_minutes,
                status: endedSession.status,
                session_end: endedSession.session_end,
                ended_by: endedSession.ended_by,
                notes: endedSession.notes
            }
        };
    }

    async updateRemainingTime(loungeId: string, sessionId: string, elapsedMinutes: number): Promise<void> {
        const session = await this._sessionRepository.getSessionById(loungeId, sessionId);
        if (!session || session.status !== SessionStatus.ACTIVE) {
            return;
        }

        const newRemainingMinutes = Math.max(0, session.allocated_minutes - elapsedMinutes);

        await this._sessionRepository.updateSession(loungeId, {
            _id: sessionId,
            remaining_minutes: newRemainingMinutes
        });

        // If time is up, the scheduled job will handle ending the session
        if (newRemainingMinutes === 0) {
            logger.info(`Session ${sessionId} has no remaining time, waiting for scheduled job to end it`);
        }
    }

    // Get queue statistics
    async getQueueStats() {
        return await this._sessionQueueService.getQueueStats();
    }

    async getAllActiveSessions(params: { loungeId: string }) {
        const { loungeId } = params;
        const sessions = await this._sessionRepository.getAllActiveSessions(loungeId);

        return {
            active_sessions: sessions.map(session => ({
                id: session._id,
                player_id: session.player_id,
                player_username: session.player_username,
                device_id: session.device_id,
                pc_id: session.pc_id,
                allocated_minutes: session.allocated_minutes,
                remaining_minutes: session.remaining_minutes,
                game_launched: session.game_launched,
                session_start: session.session_start,
                createdAt: session.createdAt
            }))
        };
    }

    async getAllSessions(params: { loungeId: string, status?: string }) {
        const { loungeId, status } = params;

        let sessionStatus: SessionStatus | undefined = undefined;
        if (status === 'active') sessionStatus = SessionStatus.ACTIVE;
        else if (status === 'completed') sessionStatus = SessionStatus.COMPLETED;
        else if (status === 'terminated') sessionStatus = SessionStatus.TERMINATED;
        else if (status === 'expired') sessionStatus = SessionStatus.EXPIRED;

        const sessions = await this._sessionRepository.getAllSessions(loungeId, sessionStatus);

        return {
            sessions: sessions.map(session => ({
                id: session._id,
                player_id: session.player_id,
                player_username: session.player_username,
                device_id: session.device_id,
                pc_id: session.pc_id,
                allocated_minutes: session.allocated_minutes,
                remaining_minutes: session.remaining_minutes,
                credits_used: session.credits_used,
                status: session.status,
                game_launched: session.game_launched,
                session_start: session.session_start,
                session_end: session.session_end,
                ended_by: session.ended_by,
                notes: session.notes,
                createdAt: session.createdAt
            }))
        };
    }

    async getSessionById(params: { loungeId: string, sessionId: string }) {
        const { loungeId, sessionId } = params;
        const session = await this._sessionRepository.getSessionById(loungeId, sessionId);

        if(!session) throw new NotFoundError('Session not found');

        return {
            session: {
                id: session._id,
                player_id: session.player_id,
                player_username: session.player_username,
                device_id: session.device_id,
                pc_id: session.pc_id,
                allocated_minutes: session.allocated_minutes,
                remaining_minutes: session.remaining_minutes,
                credits_used: session.credits_used,
                status: session.status,
                game_launched: session.game_launched,
                session_start: session.session_start,
                session_end: session.session_end,
                ended_by: session.ended_by,
                notes: session.notes,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            }
        };
    }

    async updateSessionTime(params: { loungeId: string, sessionId: string,remainingMinutes: number,}) {
        const { loungeId, sessionId, remainingMinutes } = params;

        const session = await this._sessionRepository.getSessionById(loungeId, sessionId);
        if (!session) throw new NotFoundError('Session not found');

        if (session.status !== SessionStatus.ACTIVE) {
            throw new BadRequestError('Session is not active');
        }

        const updatedSession = await this._sessionRepository.updateSessionTime(
            loungeId,
            sessionId,
            remainingMinutes
        );

        if (!updatedSession) throw new BadRequestError('Failed to update session time');

        return {
            session: {
                id: updatedSession._id,
                remaining_minutes: updatedSession.remaining_minutes,
                updated_at: updatedSession.updatedAt
            }
        };
    }


    async getSessionStats(params: { loungeId: string }) {
        const { loungeId } = params;
        const stats = await this._sessionRepository.getSessionStats(loungeId);

        const sessionStats = stats[0] || {
            total_sessions: 0,
            active_sessions: 0,
            completed_sessions: 0,
            total_minutes_allocated: 0,
            total_credits_used: 0
        };

        return {
            stats: sessionStats
        };
    }

    async getSessionsByPlayer(params: { loungeId: string; playerId: string }) {
        const { loungeId, playerId } = params;

        const player = await this._playerRepository.getPlayerById(loungeId, playerId);
        if (!player) throw new NotFoundError('Player not found');

        const sessions = await this._sessionRepository.getSessionsByPlayer(loungeId, playerId);

        return {
            player: {
                id: player._id,
                username: player.username,
                credit_balance: player.credit_balance
            },
            sessions: sessions.map(session => ({
                id: session._id,
                device_id: session.device_id,
                pc_id: session.pc_id,
                allocated_minutes: session.allocated_minutes,
                remaining_minutes: session.remaining_minutes,
                credits_used: session.credits_used,
                status: session.status,
                game_launched: session.game_launched,
                session_start: session.session_start,
                session_end: session.session_end,
                ended_by: session.ended_by,
                createdAt: session.createdAt
            }))
        };
    }

    async getSessionsByDateRange(params: {
        loungeId: string;
        startDate: Date;
        endDate: Date;
    }) {
        const { loungeId, startDate, endDate } = params;

        const sessions = await this._sessionRepository.getSessionsByDateRange(
            loungeId,
            startDate,
            endDate
        );

        return {
            date_range: {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            },
            total_sessions: sessions.length,
            sessions: sessions.map(session => ({
                id: session._id,
                player_username: session.player_username,
                pc_id: session.pc_id,
                allocated_minutes: session.allocated_minutes,
                remaining_minutes: session.remaining_minutes,
                credits_used: session.credits_used,
                status: session.status,
                game_launched: session.game_launched,
                session_start: session.session_start,
                session_end: session.session_end,
                ended_by: session.ended_by,
                createdAt: session.createdAt
            }))
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
        // Only initialize in worker processes, specifically worker 1
        if (cluster.isWorker && cluster.worker?.id === 1) {
            await sessionQueueService.initialize();
            logger.info('SessionQueueService initialized on worker 1');
        } else if (!cluster.isMaster && !cluster.isWorker) {
            // Non-clustered environment
            await sessionQueueService.initialize();
            logger.info('SessionQueueService initialized in non-clustered mode');
        }
    } catch (error) {
        logger.error('Failed to initialize SessionQueueService:', error);
    }
});

// Then modify your export to use the sessionQueueService variable:
export default new SessionService(
    new SessionRepository(),
    new PlayerRepository(),
    new DeviceRepository(),
    new TransactionRepository(),
    new CommandQueueRepository(),
    new SuperUserRepository(),
    sessionQueueService // <- Use the variable instead of creating new instance
);
