import commandQueueModel, { CommandQueueStatus, CommandType } from "../models/commandQueue.model";

export interface ICreateCommandParams {
    pc_id: string;
    command: CommandType;
    data: {
        player_id?: string | null;
        session_id?: string | null;
        allocated_minutes?: number | null;
        message?: string | null;
    };
    created_by_id: string;
}

export class CommandQueueRepository {
    private _model = commandQueueModel;

    async createCommand(loungeId: string, params: ICreateCommandParams) {
        return this._model.create({
            lounge_id: loungeId,
            pc_id: params.pc_id,
            command: params.command,
            data: params.data,
            created_by_id: params.created_by_id
        })
    }

    async getPendingCommands(loungeId: string, pcId: string) {
        return this._model.find({
            lounge_id: loungeId,
            pc_id: pcId,
            status: CommandQueueStatus.PENDING,
            expires_at: { $gt: new Date() }
        }).sort({ createdAt: 1 });
    }

    async markCommandAsExecuted(loungeId: string, commandId: string) {
        return this._model.findOneAndUpdate(
            { lounge_id: loungeId, _id: commandId },
            {
                status: CommandQueueStatus.EXECUTED,
                executed_at: new Date()
            },
            { new: true }
        );
    }

    async markCommandsAsExecuted(loungeId: string, commandIds: string[]) {
        await this._model.updateMany(
            { 
                lounge_id: loungeId, 
                _id: { $in: commandIds } 
            },
            {
                status: CommandQueueStatus.EXECUTED,
                executed_at: new Date()
            }
        );
    }

    async getCommandById(loungeId: string, commandId: string) {
        return this._model.findOne({ lounge_id: loungeId, _id: commandId });
    }

    async deleteExpiredCommands(loungeId: string) {
        await this._model.deleteMany({
            lounge_id: loungeId,
            expires_at: { $lt: new Date() },
            status: { $ne: CommandQueueStatus.EXECUTED }
        });
    }
}