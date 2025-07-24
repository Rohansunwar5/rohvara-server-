import mongoose from 'mongoose';

export enum DeviceStatus {
    AVAILABLE = 'available',
    IN_USE = 'in_use',
    OFFLINE = 'offline',
    MAINTENANCE = 'maintenance'
}

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    executable: {
        type: String,
        required: true
    },
    icon_path: {
        type: String,
        default: null
    }
}, { _id: false });

const deviceSchema = new mongoose.Schema({
    lounge_id: {
        type: String,
        required: true,
        index: true,
    },
    pc_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    pc_name: {
        type: String,
        required: true,
        trim: true
    },
    ip_address: {
        type: String,
        required: true
    },
    mac_address: {
        type: String,
        trim: true,
        default: null
    },
    status: {
        type: String,
        enum: Object.values(DeviceStatus),
        default: DeviceStatus.OFFLINE
    },
    current_user_id: {
        type: String,
        default: null
    },
    current_session_id: {
        type: String,
        default: null
    },
    last_heartbeat: {
        type: Date,
        default: Date.now
    },
    specs: {
        ram: {
            type: String,
            default: null
        },
        gpu: {
            type: String,
            default: null
        },
        cpu: {
            type: String,
            default: null
        }
    },
    installed_games: [gameSchema]
}, { timestamps: true });

deviceSchema.index({ lounge_id: 1, pc_id: 1 }, { unique: true });
deviceSchema.index({ lounge_id: 1, status: 1 });
deviceSchema.index({ lounge_id: 1, last_heartbeat: 1 });

export interface IGame {
    name: string;
    executable: string;
    icon_path: string | null;
}

export interface IDevice extends mongoose.Document {
    lounge_id: string;
    pc_id: string;
    pc_name: string;
    ip_address: string;
    mac_address: string | null;
    status: DeviceStatus;
    current_user_id: string | null;
    current_session_id: string | null;
    last_heartbeat: Date;
    specs: {
        ram: string | null;
        gpu: string | null;
        cpu: string | null;
    };
    installed_games: IGame[];
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<IDevice>('Device', deviceSchema);