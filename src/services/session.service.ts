import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import { DeviceStatus } from '../models/device.model';
import { EndedBy, SessionStatus } from '../models/session.model';
import { TransactionType } from '../models/transaction.model';
import { DeviceRepository } from '../repository/device.repository';
import { PlayerRepository } from '../repository/player.repository';
import { ICreateSessionParams, IUpdateSessionParams, SessionRepository } from '../repository/session.repository';
import { TransactionRepository } from '../repository/transaction.repository';

class SessionService {
    constructor(
        private readonly _sessionRepository: SessionRepository,
        private readonly _playerRepository: PlayerRepository,
        private readonly _deviceRepository: DeviceRepository,
        private readonly _transactionRepository: TransactionRepository
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

        // Create session params
        const sessionParams: ICreateSessionParams = {
            player_id: playerId,
            device_id: deviceId,
            pc_id: device.pc_id,
            player_username: player.username,
            allocated_minutes: minutes,
            credits_used: minutes
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

        await this._deviceRepository.updateDeviceStatus(loungeId, {
            device_id: session.device_id,
            status: DeviceStatus.AVAILABLE,
            current_user_id: null,
            current_session_id: null
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

export default new SessionService( new SessionRepository(), new PlayerRepository(), new DeviceRepository, new TransactionRepository());