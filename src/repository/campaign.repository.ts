import campaignModel from '../models/campaign.model';
import { ICreateCampaign, ILinkGameToCampaign, IUpdateCampaign } from '../services/campaign.service';

export class CampaignRepository {
  private _model = campaignModel;

  async create(params: ICreateCampaign) {
    const { endDate, game, name, startDate, userId } = params;
    return this._model.create({ game, name, startDate, endDate, userId });
  }

  async update(params: IUpdateCampaign) {
    const { endDate, game, name, startDate, userId, campaignId } = params;
    return this._model.findOneAndUpdate({ _id: campaignId, userId }, { endDate, game, name, startDate }, { new: true });
  }

  async linkGameToCampaign(params: ILinkGameToCampaign) {
    const { campaignId, game, gameId, userId } = params;
    return this._model.findOneAndUpdate({ _id: campaignId, userId }, { game, gameId }, { new: true });
  }

  async delete(campaignId: string, userId: string) {
    return this._model.findOneAndDelete({ _id: campaignId, userId });
  }

  async get(campaignId: string, userId: string) {
    return this._model.findOne({ _id: campaignId, userId });
  }

  async getAll(userId: string) {
    return this._model.find({ userId });
  }
}