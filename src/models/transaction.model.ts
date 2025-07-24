import mongoose from 'mongoose';

export enum TransactionType {
    CREDIT_PURCHASE = 'credit_purchase',
    CREDIT_DEDUCTION = 'credit_deduction',
    REFUND = 'refund'
}

const transactionSchema = new mongoose.Schema({
    lounge_id: {
        type: String,
        required: true,
        index: true
    },
    player_id: {
        type: String,
        required: true
    },
    player_username: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(TransactionType),
        default: TransactionType.CREDIT_PURCHASE
    },
    amount: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        default: null
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    payment_method: {
        type: String,
        enum: ['cash'],
        default: 'cash'
    },
    session_id: {
        type: String,
        default: null
    },
    created_by_id: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        trim: true,
        default: null
    }
}, { timestamps: true });

transactionSchema.index({ lounge_id: 1, player_id: 1 });
transactionSchema.index({ lounge_id: 1, type: 1 });
transactionSchema.index({ lounge_id: 1, createdAt: -1 });

export interface ITransaction extends mongoose.Document {
    lounge_id: string;
    player_id: string;
    player_username: string;
    type: TransactionType;
    amount: number;
    price: number | null;
    description: string;
    payment_method: 'cash';
    session_id: string | null;
    created_by_id: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<ITransaction>('Transaction', transactionSchema);