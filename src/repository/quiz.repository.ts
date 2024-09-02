import mongoose from 'mongoose';
import quizModel from '../models/quiz.model';

export interface ICreateQuizParams {
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
  }
  title: string;
  description: string;
  fontFamily: string;
  textSize: number;
  timerInSeconds: number;
  instructions?: string[];
  displayInstructions: boolean;
  logo: {
    image: string;
    websiteUrl: string;
  }
}

export interface IUpdateQuizParams {
  quizId: string;
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
  };
  userId: string;
  title: string;
  description: string;
  fontFamily: string;
  textSize: number;
  timerInSeconds: number;
  instructions?: string[];
  displayInstructions: boolean;
  logo: {
    image: string;
    websiteUrl: string;
  }
}

export class QuizRepository {
  private _model = quizModel;

  async create(params: ICreateQuizParams) {
    const {
      leaderboard, leaderboardLimit, questions, background, description, fontFamily,
      textSize, title, instructions, timerInSeconds, displayInstructions, logo
    } = params;
    return this._model.create({ leaderboard, leaderboardLimit, questions, background, description, fontFamily, textSize, title, instructions, timerInSeconds, displayInstructions, logo });
  }

  async update(params: IUpdateQuizParams) {
    const {
      leaderboard, leaderboardLimit, questions, background, quizId, userId, description,
      fontFamily, textSize, title, instructions, timerInSeconds, displayInstructions, logo
    } = params;
    return this._model.findOneAndUpdate({ _id: quizId, userId }, { leaderboard, leaderboardLimit, questions, background, description, fontFamily, textSize, title, instructions, timerInSeconds, displayInstructions, logo }, { new: true });
  }

  async get(id: string) {
    return this._model.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id)
        },
      },
      {
        $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: 'gameId',
          as: 'campaign'
        },
      },
      {
        $unwind: {
          path: '$campaign',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);
  }

  async addUserId(id: string, userId: string) {
    return this._model.findByIdAndUpdate(id, { userId }, { new: true });
  }
}