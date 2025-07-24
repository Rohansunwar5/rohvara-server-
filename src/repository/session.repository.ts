import sessionModel, { EndedBy, SessionStatus } from "../models/session.model";

export interface ICreateSessionParams {
    player_id: string;
    device_id: string;
    pc_id: string;
    player_username: string;
    allocated_minutes: number;
    credits_used: number;
}

export interface IUpdateSessionParams {
    _id: string;
    remaining_minutes?: number;
    game_launched?: string | null;
    status?: SessionStatus;
    ended_by?: EndedBy | null;
    session_end?: Date | null;
    notes?: string | null;
}

export class SessionRepository {
    private _model = sessionModel;

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
            status: SessionStatus.ACTIVE
        })
    }

    async getSessionById(loungeId: string, sessionId: string) {
        return this._model.findOne({ lounge_id: loungeId, _id: sessionId });
    }

    async getActiveSessionByPlayer(loungeId: string, playerId: string) {
        return this._model.findOne({
            lounge_id: loungeId,
            player_id: playerId,
            status: SessionStatus.ACTIVE
        })
    }

    async getActiveSessionByDevice(loungeId: string, deviceId: string) {
        return this._model.findOne({
            lounge_id: loungeId,
            device_id: deviceId,
            status: SessionStatus.ACTIVE
        })
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
        const filter: any = { lounge_id: loungeId };
        if(status) filter.status = status;

        return this._model.find(filter).sort({ createdAt: -1 });
    }

    async updateSession(loungeId: string, params: IUpdateSessionParams) {
        const updateData: any = {};

        if (params.remaining_minutes !== null) {
            updateData.remaining_minutes = params.remaining_minutes;
        }

        if (params.game_launched !== null) {
            updateData.game_launched = params.game_launched;
        }

        if (params.status) {
            updateData.status = params.status;
        }

        if (params.ended_by !== null) {
            updateData.ended_by = params.ended_by;
        }

        if (params.session_end !== null) {
            updateData.session_end = params.session_end;
        }

        if (params.notes !== null) {
            updateData.notes = params.notes;
        }

        return this._model.findOneAndUpdate(
            { lounge_id: loungeId, _id: params._id },
            updateData,
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
            { new: true  }
        )
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
        )
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
}