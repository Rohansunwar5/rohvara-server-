import { BadRequestError } from '../errors/bad-request.error';
import { InternalServerError } from '../errors/internal-server.error';
import { ICampaignGameType } from '../models/campaign.model';
import { CampaignRepository } from '../repository/campaign.repository';
import { QuizRepository } from '../repository/quiz.repository';
import { SpinTheWheelRepository } from '../repository/spin.repository';
import analyticsService from './analytics.service';
import { gameCacheManager } from './cache/entities';
import quizService from './quiz.service';
import spinService from './spin.service';

export interface ICreateCampaign {
  game: string,
  name: string,
  startDate: Date,
  endDate: Date,
  userId: string
}

export interface IUpdateCampaign {
  game: string,
  name: string,
  startDate: Date,
  endDate: Date,
  userId: string,
  campaignId: string
}

export interface ILinkGameToCampaign {
  userId: string,
  campaignId: string,
  gameId: string,
  game: string
}

class CampaignService {
  constructor(private readonly _campaignRepository: CampaignRepository, private readonly _quizRepository: QuizRepository, private readonly _spinTheWheelRepository: SpinTheWheelRepository) {
  }

  async create(params: ICreateCampaign) {
    const { endDate, game, name, startDate, userId } = params;

    const campaign = await this._campaignRepository.create({ endDate, game, name, startDate, userId });
    if (!campaign) throw new InternalServerError('Failed to create campaign');

    return campaign;
  }

  async update(params: IUpdateCampaign) {
    const { endDate, game, name, startDate, userId, campaignId } = params;

    const campaign = await this._campaignRepository.update({ endDate, game, name, startDate, userId, campaignId });
    if (!campaign) throw new BadRequestError('Failed to update campaign');

    await gameCacheManager.remove({ gameId: campaign?.gameId });

    return campaign;
  }

  async linkGameToCampaign(params: ILinkGameToCampaign) {
    const { userId, campaignId, gameId, game } = params;

    if (game === ICampaignGameType.QUIZ) {
      const quiz = (await this._quizRepository.get(gameId))[0];
      if (!quiz) throw new BadRequestError('Invalid gameId');
    }

    if (game === ICampaignGameType.SPIN_THE_WHEEL) {
      const spinTheWheel = (await this._spinTheWheelRepository.get(gameId))[0];
      if (!spinTheWheel) throw new BadRequestError('Invalid gameId');
    }

    const campaign = await this._campaignRepository.linkGameToCampaign({ userId, campaignId, gameId, game });
    if (!campaign) throw new BadRequestError('Failed to update campaign');

    return campaign;
  }

  async delete(campaignId: string, userId: string) {
    const campaign = await this._campaignRepository.delete(campaignId, userId);
    if (!campaign) throw new BadRequestError('Campaign not found');

    return true;
  }

  async get(campaignId: string, userId: string) {
    const campaign = await this._campaignRepository.get(campaignId, userId);
    if (!campaign) throw new BadRequestError('Campaign not found');

    return campaign;
  }

  async getAll(userId: string) {
    const campaign = await this._campaignRepository.getAll(userId);
    if (!campaign) throw new BadRequestError('Campaign not found');

    return campaign;
  }

  async getImpressionsAndSubmissions(params: { gameId: string, userId: string, campaignId: string, fromDate: string, toDate: string }) {
    const { campaignId, gameId, userId, fromDate, toDate } = params;
    const campaign = await this.get(campaignId, userId);
    if (!campaign) throw new BadRequestError('Invalid campaignId');
    if (!campaign.gameId) throw new BadRequestError('No game linked to campaign');
    if (!Object.values(ICampaignGameType).includes(campaign.game)) throw new BadRequestError('Invalid game type');

    if (campaign.game === ICampaignGameType.QUIZ) {
      const impressionsAndSubmissions = await analyticsService.quizGameImpressionsAndSubmissions(gameId, fromDate, toDate);

      return impressionsAndSubmissions;
    }

    if (campaign.game === ICampaignGameType.SPIN_THE_WHEEL) {
      const impressionsAndSubmissions = await analyticsService.spinTheWheelGameImpressionsAndSubmissions(campaign.gameId, fromDate, toDate);

      return impressionsAndSubmissions;
    }

    // const impressions = await analyticsService.gameImpressions(gameId, fromDate, toDate);

  }

  async getTotalImpressionsAndSubmissions(params: { gameId: string, userId: string, campaignId: string }) {
    const { campaignId, gameId, userId } = params;

    const campaign = await this.get(campaignId, userId);
    if (!campaign) throw new BadRequestError('Invalid campaignId');
    if (!campaign.gameId) throw new BadRequestError('No game linked to campaign');

    const impressions = await analyticsService.getTotalImpressionsAndSubmissions(gameId);

    return impressions;
  }

  async getCountryBasedImpressionsCounts(params: { gameId: string, userId: string, campaignId: string }) {
    const { campaignId, gameId, userId } = params;

    const campaign = await this.get(campaignId, userId);
    if (!campaign) throw new BadRequestError('Invalid campaignId');
    if (!campaign.gameId) throw new BadRequestError('No game linked to campaign');

    const impressions = await analyticsService.getCountryBasedImpressionsCounts(gameId);

    return impressions;
  }

  async getCampaignSubmissions(params: { userId: string, campaignId: string }) {
    const { campaignId, userId } = params;

    const campaign = await this.get(campaignId, userId);
    if (!campaign) throw new BadRequestError('Invalid campaignId');
    if (!campaign.gameId) throw new BadRequestError('No game linked to campaign');

    if (campaign.game === ICampaignGameType.QUIZ) {
      const sessions = await quizService.getQuizSessions(campaign.gameId);

      return sessions;
    }

    if (campaign.game === ICampaignGameType.SPIN_THE_WHEEL) {
      const sessions = await spinService.getSpinSessions(campaign.gameId);

      return sessions;
    }

    // const impressions = await analyticsService.getCountryBasedImpressionsCounts(gameId);

  }

}

export default new CampaignService(new CampaignRepository(), new QuizRepository(), new SpinTheWheelRepository());