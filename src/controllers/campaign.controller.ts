import { NextFunction, Request, Response } from 'express';
import campaignService from '../services/campaign.service';


export const newCampaign = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const { game, name, startDate, endDate } = req.body;
  const response = await campaignService.create({ endDate, game, name, startDate, userId: _id });

  next(response);
};

export const updateCampaign = async (req: Request, res: Response, next: NextFunction) => {
  const { campaignId } = req.params;
  const { _id } = req.user;
  const { game, name, startDate, endDate } = req.body;
  const response = await campaignService.update({ campaignId, endDate, game, name, startDate, userId: _id });

  next(response);
};

export const linkGameToCampaign = async (req: Request, res: Response, next: NextFunction) => {
  const { campaignId } = req.params;
  const { _id } = req.user;
  const { game, gameId } = req.body;

  const response = await campaignService.linkGameToCampaign({ campaignId, game, gameId, userId: _id });

  next(response);
};

export const deleteCampaign = async (req: Request, res: Response, next: NextFunction) => {
  const { campaignId } = req.params;
  const { _id } = req.user;
  const response = await campaignService.delete(campaignId, _id);

  next(response);
};

export const getCampaign = async (req: Request, res: Response, next: NextFunction) => {
  const { campaignId } = req.params;
  const { _id } = req.user;
  const response = await campaignService.get(campaignId, _id);

  next(response);
};

export const getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const response = await campaignService.getAll(_id);

  next(response);
};

export const getImpressionsAndSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  const { campaignId, gameId } = req.params;
  const userId = req.user._id;
  const fromDate = req.query.fromDate as string;
  const toDate = req.query.toDate as string;
  const response = await campaignService.getImpressionsAndSubmissions({ campaignId, gameId, userId, fromDate, toDate });

  next(response);
};

export const getTotalImpressionsAndSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  const { campaignId, gameId } = req.params;
  const userId = req.user._id;
  const response = await campaignService.getTotalImpressionsAndSubmissions({ campaignId, gameId, userId });

  next(response);
};

export const getCountryBasedImpressionsCounts = async (req: Request, res: Response, next: NextFunction) => {
  const { campaignId, gameId } = req.params;
  const userId = req.user._id;
  const response = await campaignService.getCountryBasedImpressionsCounts({ campaignId, gameId, userId });

  next(response);
};

export const getCampaignSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  const { campaignId } = req.params;
  const userId = req.user._id;
  const response = await campaignService.getCampaignSubmissions({ campaignId, userId });

  next(response);
};