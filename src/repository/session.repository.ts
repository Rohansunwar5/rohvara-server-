import sessionModel, { EndedBy, ISession, SessionStatus } from '../models/session.model';

export interface ICreateSessionParams {
    player_id: string;
    device_id: string;
    pc_id: string;
    player_username: string;
    allocated_minutes: number;
    credits_used: number;
    remaining_minutes: number;
    session_end_time: Date; // ADD THIS
    warning_time: Date;
}

export interface IUpdateSessionParams {
    _id: string;
    remaining_minutes?: number;
    allocated_minutes?: number; // Add this field
    credits_used?: number; // Add this field
    status?: SessionStatus;
    game_launched?: string;
    notes?: string;
}

export class SessionRepository {
    private _model = sessionModel;

    async getAllActiveSessionsGlobal(): Promise<ISession[]> {
    return this._model.find({
        status: SessionStatus.ACTIVE
    }).sort({ createdAt: -1 });
}

    async createSession(loungeId: string, params: ICreateSessionParams) {
        return this._model.create({
            lounge_id: loungeId,
            player_id: params.player_id,
            device_id: params.device_id,
            pc_id: params.pc_id,
            player_username: params.player_username,
            allocated_minutes: params.allocated_minutes,
            remaining_minutes: params.allocated_minutes,
            credits_used: params.credits_used,
            session_end_time: params.session_end_time,
            warning_time: params.warning_time,
            status: SessionStatus.ACTIVE
        });
    }

    async getSessionById(loungeId: string, sessionId: string) {
        return this._model.findOne({ lounge_id: loungeId, _id: sessionId });
    }

    async getActiveSessionByPlayer(loungeId: string, playerId: string) {
        return this._model.findOne({
            lounge_id: loungeId,
            player_id: playerId,
            status: SessionStatus.ACTIVE
        });
    }


    async getActiveSessionByDevice(loungeId: string, deviceId: string) {
        return this._model.findOne({
            lounge_id: loungeId,
            device_id: deviceId,
            status: SessionStatus.ACTIVE
        });
    }

    async getActiveSessionByPcId(loungeId: string, pcId: string) {
        return this._model.findOne({
            lounge_id: loungeId,
            pc_id: pcId,
            status: SessionStatus.ACTIVE
        });
    }

    async getAllActiveSessions(loungeId: string) {
        return this._model.find({
            lounge_id: loungeId,
            status: SessionStatus.ACTIVE,
        }).sort({ createdAt: -1 });
    }

    async getAllSessions(loungeId: string, status?: SessionStatus) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { lounge_id: loungeId };
        if(status) filter.status = status;

        return this._model.find(filter).sort({ createdAt: -1 });
    }

    async updateSession(loungeId: string, params: IUpdateSessionParams): Promise<ISession | null> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};

        if (params.remaining_minutes !== undefined) updateData.remaining_minutes = params.remaining_minutes;
        if (params.allocated_minutes !== undefined) updateData.allocated_minutes = params.allocated_minutes;
        if (params.credits_used !== undefined) updateData.credits_used = params.credits_used;
        if (params.status) updateData.status = params.status;
        if (params.game_launched) updateData.game_launched = params.game_launched;
        if (params.notes) updateData.notes = params.notes;

        return await this._model.findOneAndUpdate(
            { _id: params._id, lounge_id: loungeId },
            { $set: updateData },
            { new: true }
        );
    }
    async updateSessionTime(loungeId: string, sessionId: string, remainingMinutes: number) {
        return this._model.findOneAndUpdate(
            { lounge_id: loungeId, _id: sessionId },
            {
                remaining_minutes: remainingMinutes,
                updated_at: new Date()
            },
            { new: true }
        );
    }

    async endSession(loungeId: string, sessionId: string, endedBy: EndedBy, notes?: string) {
        return this._model.findOneAndUpdate(
            { lounge_id: loungeId, _id: sessionId },
            {
                status: SessionStatus.COMPLETED,
                session_end: new Date(),
                ended_by: endedBy,
                notes: notes || null,
                updated_at: new Date ()
            },
            { new: true }
        );
    }

    async getExpiredSessions(loungeId: string) {
        return this._model.find({
            lounge_id: loungeId,
            status: SessionStatus.ACTIVE,
            remaining_minutes: { $lte: 0 }
        });
    }

    async getSessionsByPlayer(loungeId: string, playerId: string) {
        return this._model.find({
            lounge_id: loungeId,
            player_id: playerId
        }).sort({ createdAt: -1 });
    }

    async getSessionsByDateRange(loungeId: string, startDate: Date, endDate: Date) {
        return this._model.find({ lounge_id: loungeId, createdAt: { $gte: startDate, $lte: endDate }}).sort({ createdAt: -1 });
    }

    async getSessionStats(loungeId: string) {
        return this._model.aggregate([
        { $match: { lounge_id: loungeId } },
        {
                $group: {
                    _id: null,
                    total_sessions: { $sum: 1 },
                    active_sessions: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    completed_sessions: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    total_minutes_allocated: { $sum: '$allocated_minutes' },
                    total_credits_used: { $sum: '$credits_used' }
                }
            }
        ]);
    }

    async batchUpdateRemainingMinutes(updates: Array<{ sessionId: string; remainingMinutes: number }>): Promise<void> {
        const bulkOps = updates.map(update => ({
            updateOne: {
                filter: { _id: update.sessionId },
                update: { $set: { remaining_minutes: update.remainingMinutes } }
            }
        }));

        if (bulkOps.length > 0) {
            await this._model.bulkWrite(bulkOps);
        }
    }
}