import mongoose from 'mongoose';

const spinTheWheelUserSessionSchema = new mongoose.Schema({
  spinTheWheelId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  fullName: {
    type: String,
  },
  email: {
    type: String,
    required: true
  },
  prize: {
    type: String,
    required: true
  },
  isWinner: {
    type: Boolean,
    required: true,
    default: false
  }
}, { timestamps: true });

export interface ISpinTheWheelUserSession extends mongoose.Schema {
  spinTheWheelId: string;
  fullName?: string;
  email: string;
  prize: string;
  isWinner: boolean;
}

export default mongoose.model<ISpinTheWheelUserSession>('spinTheWheel-user-session', spinTheWheelUserSessionSchema);