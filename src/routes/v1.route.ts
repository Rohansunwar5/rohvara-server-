
import { Router } from 'express';
import { country, health, helloWorld } from '../controllers/health.controller';
import { asyncHandler } from '../utils/asynchandler';
import authRouter from './auth.route';
import gameRouter from './game.route';
import contactRouter from './contact.route';
import campaignRouter from './campaign.route';

const v1Router = Router();

v1Router.get('/', asyncHandler(helloWorld));
v1Router.get('/health', asyncHandler(health));
v1Router.use('/auth', authRouter);
v1Router.use('/game', gameRouter);
v1Router.use('/contact', contactRouter);
v1Router.use('/campaign', campaignRouter);
v1Router.get('/country', asyncHandler(country));

export default v1Router;