import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { authenticatePlayer, checkCommands, sessionLogout, updateStatus, updateHeartbeat, reportError } from '../controllers/client.controller';
import { authenticatePlayerValidator, pcIdValidator, reportErrorValidator, sessionLogoutValidator, updateStatusValidator } from '../middlewares/validators/client.validator';

const clientRouter = Router();

clientRouter.post('/authenticate', authenticatePlayerValidator, asyncHandler(authenticatePlayer));
clientRouter.get('/commands/:pcId', pcIdValidator, asyncHandler(checkCommands));
clientRouter.post('/status/:pcId', updateStatusValidator, asyncHandler(updateStatus));
// clientRouter.get('/games/:pcId', pcIdValidator, asyncHandler(getAvailableGames));
clientRouter.post('/heartbeat/:pcId', pcIdValidator, asyncHandler(updateHeartbeat));
clientRouter.post('/logout/:pcId', sessionLogoutValidator, asyncHandler(sessionLogout));
clientRouter.post('/error/:pcId', reportErrorValidator, asyncHandler(reportError));

export default clientRouter;