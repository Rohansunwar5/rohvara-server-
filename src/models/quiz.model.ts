import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctOptionValue: {
    type: String,
    required: true
  }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId
  },
  leaderboard: {
    type: Boolean,
    default: false
  },
  leaderboardLimit: {
    type: Number,
    default: 0
  },
  questions: [questionSchema],
  background: {
    backgroundColor: { // normal option
      type: String
    },
    textColor: {
      type: String
    },
    primaryBColor: {
      type: String
    },
    secondaryBColor: {
      type: String
    },
    image: {
      type: String
    },
  },
  logo: {
    image: {
      type: String
    },
    websiteUrl: {
      type: String
    }
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  fontFamily: {
    type: String,
    required: true
  },
  textSize: {
    type: Number,
    required: true
  },
  timerInSeconds: {
    type: Number,
    required: true,
    default: 30
  },
  instructions: {
    type: [String]
  },
  displayInstructions: {
    type: Boolean,
    required: true,
    default: false
  },
}, { timestamps: true });

export interface IQuiz extends mongoose.Schema {
  userId: string;
  leaderboard: boolean;
  leaderboardLimit: number;
  questions: {
    question: string;
    options: string[];
    correctOptionValue: string;
  }[],
  background: {
    textColor?: string;
    backgroundColor?: string;
    primaryBColor?: string;
    SecondaryBColor?: string;
    image?: string;
  },
  title: string;
  description: string;
  fontFamily: string;
  textSize: number;
  timerInSeconds: number;
  instructions: string[];
  displayInstructions: boolean;
  logo: {
    image: string;
    websiteUrl: string;
  }
}

export default mongoose.model<IQuiz>('Quiz', quizSchema);
