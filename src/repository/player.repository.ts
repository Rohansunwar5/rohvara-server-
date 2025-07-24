import playerModel, { IPlayer, PlayerStatus } from '../models/player.model';

export interface ICreatePlayerParams {
    username: string;
    password: string;
    display_name?: string | null;
    phone?: string | null;
    created_by_id: string;
}

export interface IUpdatePlayerParams {
    _id: string;
    display_name?: string | null;
    phone?: string | null;
    status?: PlayerStatus;
}

export interface IAddCreditsParams {
    player_id: string;
    amount: number;
}

export class PlayerRepository {
    private _model = playerModel;

    async getPlayerByUsername(loungeId: string, username: string) {
        return this._model.findOne({ lounge_id: loungeId, username});
    }

    async getPlayerById(loungeId: string, playerId: string): Promise<IPlayer | null> {
        return this._model.findOne({ lounge_id: loungeId, _id: playerId });
    }

    async getAllPlayers(loungeId: string, status?: PlayerStatus): Promise<IPlayer[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { lounge_id: loungeId };
        if (status) filter.status = status;

        return this._model.find(filter).select('-password').sort({ createdAt: -1 });
    }

    async createPlayer(loungeId: string, params: ICreatePlayerParams): Promise<IPlayer> {
        return this._model.create({
            lounge_id: loungeId,
            username: params.username,
            password: params.password,
            display_name: params.display_name,
            phone: params.phone,
            created_by_id: params.created_by_id
        });
    }

    async updatePlayer(loungeId: string, params: IUpdatePlayerParams) {
        return this._model.findOneAndUpdate(
        { lounge_id: loungeId, _id: params._id },
        {
            display_name: params.display_name,
            phone: params.phone,
            status: params.status
        },
        { new: true }
        ).select('-password');
    }

    async addCredits(loungeId: string, params: IAddCreditsParams) {
        const { player_id, amount } = params;
        return this._model.findOneAndUpdate(
        { lounge_id: loungeId, _id: player_id },
        {
            $inc: { credit_balance: amount },
            last_login: new Date()
        },
        { new: true }
        ).select('-password');
    }

    async deductCredits(loungeId: string, playerId: string, amount: number) {
        return this._model.findOneAndUpdate(
        {
            lounge_id: loungeId,
            _id: playerId,
            credit_balance: { $gte: amount }
        },
        {
            $inc: {
            credit_balance: -amount,
            total_spent: amount
            }
        },
        { new: true }
        ).select('-password');
    }

    async updateLastLogin(loungeId: string, playerId: string): Promise<void> {
        await this._model.findOneAndUpdate(
        { lounge_id: loungeId, _id: playerId },
        { last_login: new Date() }
        );
    }

    async getPlayerStats(loungeId: string) {
        return this._model.aggregate([
        { $match: { lounge_id: loungeId } },
        {
            $group: {
            _id: null,
            total_players: { $sum: 1 },
            active_players: {
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            total_credits: { $sum: '$credit_balance' },
            total_revenue: { $sum: '$total_spent' }
            }
        }
        ]);
    }
}