import mongoose from 'mongoose';

export enum PlayerStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    BANNED = 'banned'
}

const playerSchema = new mongoose.Schema({
    lounge_id: {
        type: String,
        required: true,
        index: true,
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    display_name: {
        type: String,
        trim: true,
        default: null
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    credit_balance: {
        type: Number,
        default: 0,
        min: 0
    },
    total_spent: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(PlayerStatus),
        default: PlayerStatus.ACTIVE
    },
    last_login: {
        type: Date,
        default: null
    },
    created_by_id: {
        type: String,
        required: true
    }
}, { timestamps: true });

playerSchema.index({ lounge_id: 1, username: 1 }, { unique: true });
playerSchema.index({ lounge_id: 1, status: 1 });

export interface IPlayer extends mongoose.Document {
    lounge_id: string;
    username: string;
    password: string;
    display_name: string | null;
    phone: string | null;
    credit_balance: number;
    total_spent: number;
    status: PlayerStatus;
    last_login: Date | null;
    created_by_id: string;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<IPlayer>('Player', playerSchema);