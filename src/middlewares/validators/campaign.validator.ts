import { validateRequest } from '.';
import { ICampaignGameType } from '../../models/campaign.model';
import { isIn, isRequired } from '../../utils/validator.utils';

export const createCampaignValidator = [
  isRequired('name'),
  isIn('game', Object.values(ICampaignGameType)),
  isRequired('startDate'),
  isRequired('endDate'),
  ...validateRequest
];

export const udpateCampaignValidator = [
  isRequired('name'),
  isIn('game', Object.values(ICampaignGameType)),
  isRequired('startDate'),
  isRequired('endDate'),
  isRequired('campaignId'),
  ...validateRequest
];

export const linkGameToCampaignValidator = [
  isIn('game', Object.values(ICampaignGameType)),
  isRequired('gameId'),
  isRequired('campaignId'),
  ...validateRequest
];

export const deleteCampaignValidator = [
  isRequired('campaignId'),
  ...validateRequest
];

export const getCampaignValidator = [
  isRequired('campaignId'),
  ...validateRequest
];