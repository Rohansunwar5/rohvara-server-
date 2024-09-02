import mongoose from 'mongoose';

export enum ICampaignGameType {
  QUIZ = 'quiz',
  SPIN_THE_WHEEL = 'spin-the-wheel'
}

const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  gameId: {
    type: mongoose.Types.ObjectId
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  game: {
    type: String,
    enum: ICampaignGameType,
    required: true,
  },
}, { timestamps: true });

campaignSchema.index({ gameId: 1 });

export interface ICampaign extends mongoose.Schema {
  userId: string;
  name: string;
  gameId: string;
  startDate: string;
  endDate: string;
  game: ICampaignGameType;
}


export default mongoose.model<ICampaign>('Campaign', campaignSchema);
