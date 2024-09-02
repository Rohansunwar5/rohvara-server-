import mongoose from 'mongoose';
import spinUserSessionModel from '../models/spin-user-session.model';
import spinModel from '../models/spin.model';

export interface ISpinTheWheelCreateParams {
  segments: {
    id: string;
    prize: string;
    weight: number;
    color: string;
    textColor: string;
    isWin: boolean;
  }[],
  background: {
    hexCode: string;
    textSize: string;
    fontFamily: string;
    image: string;
  },
  winnersOnly: boolean;
  instructions?: string[];
  title: string;
  description: string;
  displayInstructions: boolean;
  textColor: string;
  secondaryColor: string;
  logo: {
    image: string;
    websiteUrl: string;
  },
  favicon?: string;
}


export interface IUpdateSpinTheWheelParams {
  segments: {
    id: string;
    prize: string;
    weight: number;
    color: string;
    textColor: string;
    isWin: boolean;
  }[],
  background: {
    hexCode: string;
    textSize: string;
    fontFamily: string;
    image: string;
  },
  winnersOnly: boolean;
  userId: string;
  spinTheWheelId: string;
  instructions?: string[];
  title: string;
  description: string;
  displayInstructions: boolean;
  textColor: string;
  secondaryColor: string;
  logo: {
    image: string;
    websiteUrl: string;
  },
  favicon?: string;
}
export class SpinTheWheelRepository {
  private _model = spinModel;
  private spinTheWheelUserSessionModel = spinUserSessionModel;

  async create(params: ISpinTheWheelCreateParams) {
    const { segments, background, winnersOnly, instructions, description, title, displayInstructions, textColor, secondaryColor, logo, favicon } = params;
    return this._model.create({ segments, background, winnersOnly, instructions, description, title, displayInstructions, secondaryColor, textColor, logo, favicon });
  }

  async update(params: IUpdateSpinTheWheelParams) {
    const { segments, background, winnersOnly, userId, spinTheWheelId, description, title, displayInstructions, secondaryColor, textColor, instructions, logo, favicon } = params;
    return this._model.findOneAndUpdate({ _id: spinTheWheelId, userId }, {
      $set: {
        segments, background, winnersOnly, description, title, instructions, textColor, secondaryColor, displayInstructions, logo, favicon
      }
    }, { new: true, runValidators: true });
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

  async addUserId(userId: string, id: string) {
    return this._model.findByIdAndUpdate(id, { userId }, { new: true });
  }

  async spinTheWheelUserSessionExists(email: string, spinTheWheelId: string) {
    return this.spinTheWheelUserSessionModel.findOne({ email, spinTheWheelId });
  }

  async spinTheWheelUserSession(params: { email: string, spinTheWheelId: string, prize: string, isWinner: boolean, fullName?: string }) {
    const { email, isWinner, prize, spinTheWheelId, fullName } = params;
    return this.spinTheWheelUserSessionModel.create({ email, spinTheWheelId, fullName, prize, isWinner });
  }

  async getSpinSessions(spinTheWheelId: string) {
    return this.spinTheWheelUserSessionModel.find({ spinTheWheelId });
  }
}