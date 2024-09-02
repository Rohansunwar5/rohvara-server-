import mongoose from 'mongoose';

const quizUserSessionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  }
}, { timestamps: true });

export interface IQuizUserSession extends mongoose.Schema {
  quizId: string;
  fullName: string;
  score: number;
  duration: number;
  email: string;
}

export default mongoose.model<IQuizUserSession>('quiz-user-session', quizUserSessionSchema);