import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    lanServerKey: {
        type: String,
        required: true,
        unique: true,
    },
    contactInfo: {
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
        }
    },
    settings: {
        hourlyRate: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            requried: true,
            default: 'INR',
        },
        timezone: {
            type: String,
            required: true,
            default: 'Asia/Kolkata',
        },
        operatingHours: {
            open: {
                type: String,
                required: true,
                default: '09:00'
            },
            close: {
                type: String,
                required: true,
                default: '23:00'
            }
            },
            maxSessionDuration: {
            type: Number,
            required: true,
            default: 480
        }
    }
}, { timestamps: true });

export interface IVenue extends mongoose.Schema {
    name: string;
    address: string;
    lanServerKey: string;
    contactInfo: {
        phone: string;
        email: string;
    };
    settings: {
        hourlyRate: number;
        currency: string;
        timezone: string;
        operatingHours: {
            open: string;
            close: string;
        };
        maxSessionDuration: number;
    };
}

export default mongoose.model<IVenue>('Venue', venueSchema);