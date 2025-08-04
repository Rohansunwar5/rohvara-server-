import mongoose from 'mongoose';

export enum SessionStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    TERMINATED = 'terminated',
    EXPIRED = 'expired'
}

export enum EndedBy {
    PLAYER = 'player',
    SUPERUSER = 'superuser',
    TIMEOUT = 'timeout',
    SYSTEM = 'system'
}

const sessionSchema = new mongoose.Schema({
    lounge_id: {
        type: String,
        required: true,
        index: true
    },
    player_id: {
        type: String,
        required: true
    },
    device_id: {
        type: String,
        required: true
    },
    pc_id: {
        type: String,
        required: true
    },
    player_username: {
        type: String,
        required: true
    },
    session_start: {
        type: Date,
        default: Date.now
    },
    session_end: {
        type: Date,
        default: null
    },
    allocated_minutes: {
        type: Number,
        required: true,
        min: 1
    },
    remaining_minutes: {
        type: Number,
        required: true,
        min: 0
    },
    credits_used: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(SessionStatus),
        default: SessionStatus.ACTIVE
    },
    game_launched: {
        type: String,
        default: null
    },
    ended_by: {
        type: String,
        enum: Object.values(EndedBy),
        default: null
    },
    notes: {
        type: String,
        trim: true,
        default: null
    },
    session_end_time: {
        type: Date,
        required: true
    },
    warning_time: {
        type: Date,
        required: true
    },
}, { timestamps: true });


sessionSchema.index({ lounge_id: 1, player_id: 1 });
sessionSchema.index({ lounge_id: 1, device_id: 1 });
sessionSchema.index({ lounge_id: 1, status: 1 });
sessionSchema.index({ lounge_id: 1, session_start: -1 });
sessionSchema.index({ lounge_id: 1, status: 1, remaining_minutes: 1 });

export interface ISession extends mongoose.Document {
    lounge_id: string;
    player_id: string;
    device_id: string;
    pc_id: string;
    player_username: string;
    session_start: Date;
    session_end: Date | null;
    allocated_minutes: number;
    remaining_minutes: number;
    credits_used: number;
    status: SessionStatus;
    game_launched: string | null;
    ended_by: EndedBy | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    session_end_time: Date;
    warning_time: Date;
}

export default mongoose.model<ISession>('Session', sessionSchema);