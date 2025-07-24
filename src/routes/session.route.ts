import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { endSession, extendSession, forceEndSession, getAllActiveSessions, getAllSessions, getSessionById, getSessionsByDateRange, getSessionsByPlayer, getSessionStats, startSession, updateSessionTime } from '../controllers/session.controller';
import { dateRangeValidator, endSessionValidator, extendSessionValidator, forceEndSessionValidator, playerIdValidator, sessionIdValidator, sessionStatusValidator, startSessionValidator, updateSessionTimeValidator } from '../middlewares/validators/session.validator';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';

const sessionRouter = Router();

sessionRouter.post('/', isLoggedIn, startSessionValidator, asyncHandler(startSession));
sessionRouter.get('/', isLoggedIn, sessionStatusValidator, asyncHandler(getAllSessions));
sessionRouter.get('/active', isLoggedIn, asyncHandler(getAllActiveSessions));
sessionRouter.get('/stats', isLoggedIn, asyncHandler(getSessionStats));
sessionRouter.get('/date-range', isLoggedIn, dateRangeValidator, asyncHandler(getSessionsByDateRange));
sessionRouter.get('/player/:playerId', isLoggedIn, playerIdValidator, asyncHandler(getSessionsByPlayer));
sessionRouter.get('/:sessionId', isLoggedIn, sessionIdValidator, asyncHandler(getSessionById));

//session control
sessionRouter.put('/:sessionId/end', isLoggedIn, endSessionValidator, asyncHandler(endSession));
sessionRouter.put('/:sessionId/force-end', isLoggedIn, forceEndSessionValidator, asyncHandler(forceEndSession));
sessionRouter.put('/sessionId/time', isLoggedIn, updateSessionTimeValidator, asyncHandler(updateSessionTime));
sessionRouter.put('/sessionId/extend', isLoggedIn, extendSessionValidator, asyncHandler(extendSession));

export default sessionRouter;
