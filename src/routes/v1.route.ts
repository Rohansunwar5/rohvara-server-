import { Router } from 'express';
import { country, health, helloWorld } from '../controllers/health.controller';
import { asyncHandler } from '../utils/asynchandler';
import authRouter from './auth.route';
import contactRouter from './contact.route';
import sessionRouter from './session.route';
import deviceRouter from './device.route';
import clientRouter from './client.route';

const v1Router = Router();

v1Router.get('/', asyncHandler(helloWorld));
v1Router.get('/health', asyncHandler(health));
v1Router.use('/auth', authRouter);
v1Router.use('/contact', contactRouter);
v1Router.get('/country', asyncHandler(country));
v1Router.use('/session', sessionRouter);
v1Router.use('/device', deviceRouter);
v1Router.use('/client', clientRouter);

export default v1Router;
