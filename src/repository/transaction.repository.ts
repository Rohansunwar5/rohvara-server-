import transactionModel, { ITransaction, TransactionType } from '../models/transaction.model';

export interface ICreateTransactionParams {
  player_id: string;
  player_username: string;
  type: TransactionType;
  amount: number;
  price?: number;
  description: string;
  session_id?: string;
  created_by_id: string;
  notes?: string;
}

export class TransactionRepository {
    private _model = transactionModel;

    async createTransaction(loungeId: string, params: ICreateTransactionParams): Promise<ITransaction> {
        return this._model.create({
        lounge_id: loungeId,
        ...params
        });
    }

    async getTransactionsByPlayer(loungeId: string, playerId: string): Promise<ITransaction[]> {
        return this._model.find({
        lounge_id: loungeId,
        player_id: playerId
        }).sort({ createdAt: -1 });
    }

    async getAllTransactions( loungeId: string, type?: TransactionType, startDate?: Date,endDate?: Date ): Promise<ITransaction[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { lounge_id: loungeId };

        if (type) filter.type = type;
        if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = startDate;
        if (endDate) filter.createdAt.$lte = endDate;
        }

        return this._model.find(filter).sort({ createdAt: -1 });
    }

    async getDailyRevenue(loungeId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this._model.aggregate([
        {
            $match: {
            lounge_id: loungeId,
            type: TransactionType.CREDIT_PURCHASE,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
            }
        },
        {
            $group: {
            _id: null,
            total_revenue: { $sum: '$price' },
            total_credits_sold: { $sum: '$amount' },
            transaction_count: { $sum: 1 }
            }
        }
        ]);
    }
}