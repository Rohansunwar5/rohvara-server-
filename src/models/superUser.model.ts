import mongoose from 'mongoose';

const superUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
    },
    lounge_name: {
        type: String,
        required: true,
        trim: true
    },
    last_login: {
        type: Date,
        default: null
    },
    settings: {
        hourly_rate: {
            type: Number,
            default: 30
        },
        currency: {
            type: String,
            default: 'INR'
        },
        timezone: {
            type: String,
            default: 'Asia/Kolkata'
        },
        session_warning_minutes: {
            type: Number,
            default: 5
        }
    }
}, { timestamps: true });

export interface ISuperUser extends mongoose.Document {
    username: string;
    password: string;
    email: string | null;
    lounge_name: string;
    last_login: Date | null;
    settings: {
        hourly_rate: number;
        currency: string;
        timezone: string;
        session_warning_minutes: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<ISuperUser>('SuperUser', superUserSchema);