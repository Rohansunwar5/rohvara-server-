import { Router } from 'express';
import { createCampaignValidator, deleteCampaignValidator, getCampaignValidator, linkGameToCampaignValidator, udpateCampaignValidator } from '../middlewares/validators/campaign.validator';
import { asyncHandler } from '../utils/asynchandler';
import { deleteCampaign, getCampaign, getCampaignSubmissions, getCampaigns, getCountryBasedImpressionsCounts, getImpressionsAndSubmissions, getTotalImpressionsAndSubmissions, linkGameToCampaign, newCampaign, updateCampaign } from '../controllers/campaign.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';

const campaignRouter = Router();

campaignRouter.post('/', isLoggedIn, createCampaignValidator, asyncHandler(newCampaign));
campaignRouter.patch('/:campaignId', isLoggedIn, udpateCampaignValidator, asyncHandler(updateCampaign));
campaignRouter.post('/link-game/:campaignId', isLoggedIn, linkGameToCampaignValidator, asyncHandler(linkGameToCampaign));
campaignRouter.delete('/:campaignId', isLoggedIn, deleteCampaignValidator, asyncHandler(deleteCampaign));
campaignRouter.get('/:campaignId', isLoggedIn, getCampaignValidator, asyncHandler(getCampaign));
campaignRouter.get('/', isLoggedIn, asyncHandler(getCampaigns));
campaignRouter.get('/graph/:campaignId/:gameId', isLoggedIn, asyncHandler(getImpressionsAndSubmissions));
campaignRouter.get('/meta/:campaignId/:gameId', isLoggedIn, asyncHandler(getTotalImpressionsAndSubmissions));
campaignRouter.get('/country/:campaignId/:gameId', isLoggedIn, asyncHandler(getCountryBasedImpressionsCounts));
campaignRouter.get('/submissions/:campaignId', isLoggedIn, asyncHandler(getCampaignSubmissions));

export default campaignRouter;