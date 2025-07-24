import mongoose from 'mongoose';

export enum CommandType {
    START_SESSION = 'START_SESSION',
    END_SESSION = 'END_SESSION',
    LOCK_PC = 'LOCK_PC',  
    UNLOCK_PC = 'UNLOCK_PC',
    ANNOUNCEMENT = 'ANNOUNCEMENT'
}

export enum CommandQueueStatus {
    PENDING = 'pending',
    EXECUTED = 'executed',
    EXPIRED = 'expired'
}

const commandQueueSchema = new mongoose.Schema({
    lounge_id: {
        type: String,
        required: true,
        index: true
    },
    pc_id: {
        type: String,
        required: true
    },
    command: {
        type: String,
        enum: Object.values(CommandType),
        required: true
    },
    data: {
        player_id: {
            type: String,
            default: null
        },
        session_id: {
            type: String,
            default: null
        },
        allocated_minutes: {
            type: Number,
            default: null
        },
        message: {
            type: String,
            default: null
        }
    },
    status: {
        type: String,
        enum: Object.values(CommandQueueStatus),
        default: CommandQueueStatus.PENDING
    },
    executed_at: {
        type: Date,
        default: null
    },
    expires_at: {
        type: Date,
        default: () => new Date(Date.now() + 5 * 60 * 1000) 
    },
    created_by_id: {
        type: String,
        required: true
    }
}, { timestamps: true });

// TTL index for auto-expiring commands
commandQueueSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
commandQueueSchema.index({ lounge_id: 1, pc_id: 1, status: 1 });

export interface ICommandQueue extends mongoose.Document {
    lounge_id: string;
    pc_id: string;
    command: CommandType;
    data: {
        player_id: string | null;
        session_id: string | null;
        allocated_minutes: number | null;
        message: string | null;
    };
    status: CommandQueueStatus;
    executed_at: Date | null;
    expires_at: Date;
    created_by_id: string;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<ICommandQueue>('CommandQueue', commandQueueSchema);