import bcrypt from 'bcrypt';
import { BadRequestError } from '../errors/bad-request.error';
import { PlayerRepository } from '../repository/player.repository';
import { TransactionRepository } from '../repository/transaction.repository';
import { NotFoundError } from '../errors/not-found.error';
import { TransactionType } from '../models/transaction.model';
import { PlayerStatus } from '../models/player.model';

class PlayerService {
    constructor( private readonly _playerRepository: PlayerRepository, private readonly _transactionRepository: TransactionRepository) {}

    async createplayer(params: { loungeId: string, username: string, password: string, display_name?: string, phone?: string, createdById: string }) {
        const { loungeId, username, password, display_name, phone, createdById } = params;

        const existingPlayer = await this._playerRepository.getPlayerByUsername(loungeId, username);
        if (existingPlayer) {
            throw new BadRequestError('Username already exisits in this lounge');
        }

        const hanshedPassword = await bcrypt.hash(password, 10);

        const player = await this._playerRepository.createPlayer(loungeId, { username, password: hanshedPassword, display_name, phone, created_by_id: createdById});

        return {
            player: {
            id: player._id,
            username: player.username,
            display_name: player.display_name,
            phone: player.phone,
            credit_balance: player.credit_balance,
            status: player.status,
            createdAt: player.createdAt
            }
        };
    }

    async addCredits(params: { loungeId: string, playerId: string, minutes: number, price: number, createdById: string }) {
        const { loungeId, playerId, minutes, price, createdById } = params;

        const player = await this._playerRepository.getPlayerById(loungeId, playerId);
        if (!player) throw new NotFoundError('Player not found');

        const updatedPlayer = await this._playerRepository.addCredits(loungeId, {
            player_id: playerId,
            amount: minutes
        });

        if (!updatedPlayer) throw new BadRequestError('Failed to add credits');

        await this._transactionRepository.createTransaction(loungeId, {
            player_id: playerId,
            player_username: player.username,
            type: TransactionType.CREDIT_PURCHASE,
            amount: minutes,
            price: price,
            description: `${minutes} minutes gaming credit`,
            created_by_id: createdById
        });

        return {
            player: {
                id: updatedPlayer._id,
                username: updatedPlayer.username,
                credit_balance: updatedPlayer.credit_balance,
                total_spent: updatedPlayer.total_spent
            },
            transaction: {
                minutes_added: minutes,
                price_paid: price,
                new_balance: updatedPlayer.credit_balance
            }
        };
    }

    async getAllPlayers(params: { loungeId: string; status?: string }) {
        const { loungeId, status } = params;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const players = await this._playerRepository.getAllPlayers(loungeId, status as any);

        return {
        players: players.map(player => ({
            id: player._id,
            username: player.username,
            display_name: player.display_name,
            phone: player.phone,
            credit_balance: player.credit_balance,
            total_spent: player.total_spent,
            status: player.status,
            last_login: player.last_login,
            createdAt: player.createdAt
        }))
        };
    }

    async getPlayerById(params: { loungeId: string; playerId: string }) {
        const { loungeId, playerId } = params;
        const player = await this._playerRepository.getPlayerById(loungeId, playerId);

        if (!player) throw new NotFoundError('Player not found');

        const transactions = await this._transactionRepository.getTransactionsByPlayer(loungeId, playerId);

        return {
        player: {
            id: player._id,
            username: player.username,
            display_name: player.display_name,
            phone: player.phone,
            credit_balance: player.credit_balance,
            total_spent: player.total_spent,
            status: player.status,
            last_login: player.last_login,
            createdAt: player.createdAt
        },
        transactions: transactions.map(transaction => ({
            id: transaction._id,
            type: transaction.type,
            amount: transaction.amount,
            price: transaction.price,
            description: transaction.description,
            createdAt: transaction.createdAt
        }))
        };
    }

    async updatePlayer(params: { loungeId: string; playerId: string; display_name?: string; phone?: string; status?: string }) {
        const { loungeId, playerId, display_name, phone, status } = params;

        const existingPlayer = await this._playerRepository.getPlayerById(loungeId, playerId);
        if (!existingPlayer) throw new NotFoundError('Player not found');

        let playerStatus: PlayerStatus | undefined;
        if (status === 'active') playerStatus = PlayerStatus.ACTIVE;
        else if (status === 'suspended') playerStatus = PlayerStatus.SUSPENDED;
        else if (status === 'banned') playerStatus = PlayerStatus.BANNED;

        // Update player params without spread
        const updateParams = {
        _id: playerId,
        display_name: display_name || null,
        phone: phone || null,
        status: playerStatus
        };

        // Update player
        const updatedPlayer = await this._playerRepository.updatePlayer(loungeId, updateParams);

        if (!updatedPlayer) throw new BadRequestError('Failed to update player');

        return {
        player: {
            id: updatedPlayer._id,
            username: updatedPlayer.username,
            display_name: updatedPlayer.display_name,
            phone: updatedPlayer.phone,
            credit_balance: updatedPlayer.credit_balance,
            status: updatedPlayer.status,
            last_login: updatedPlayer.last_login,
            updatedAt: updatedPlayer.updatedAt
        }
        };
    }

    async getPlayerTransactions(params: { loungeId: string, playerId: string }) {
        const { loungeId, playerId } = params;

        const player = await this._playerRepository.getPlayerById(loungeId, playerId);
        if (!player) throw new NotFoundError('Player not found');

        const transactions = await this._transactionRepository.getTransactionsByPlayer(loungeId, playerId);

        return {
        player: {
            id: player._id,
            username: player.username,
            display_name: player.display_name,
            credit_balance: player.credit_balance,
            total_spent: player.total_spent
        },
        transactions: transactions.map(transaction => ({
            id: transaction._id,
            type: transaction.type,
            amount: transaction.amount,
            price: transaction.price,
            description: transaction.description,
            payment_method: transaction.payment_method,
            notes: transaction.notes,
            createdAt: transaction.createdAt
        }))
        };
    }

    async getDailyRevenue(params: { loungeId: string; date: Date }) {
        const { loungeId, date } = params;

        const revenueData = await this._transactionRepository.getDailyRevenue(loungeId, date);

        const revenue = revenueData[0] || {
        total_revenue: 0,
        total_credits_sold: 0,
        transaction_count: 0
        };

        return {
        date: date.toISOString().split('T')[0],
        revenue: revenue
        };
    }

    async getPlayerStats(params: { loungeId: string }) {
        const { loungeId } = params;
        const stats = await this._playerRepository.getPlayerStats(loungeId);

        const playerStats = stats[0] || {
        total_players: 0,
        active_players: 0,
        total_credits: 0,
        total_revenue: 0
        };

        return {
        stats: playerStats
        };
    }
}

export default new PlayerService(new PlayerRepository(), new TransactionRepository());