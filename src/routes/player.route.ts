import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { addCredits, createPlayer, getAllPlayers, getDailyRevenue, getPlayerById, getPlayerStats, getPlayerTransactions, updatePlayer } from '../controllers/player.controller';
import { addCreditsValidator, createPlayerValidator, dateValidator, playerIdValidator, playerStatusValidator, updatePlayerValidator } from '../middlewares/validators/player.validator';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';

const playerRouter = Router();

playerRouter.post('/', isLoggedIn, createPlayerValidator, asyncHandler(createPlayer));
playerRouter.get('/', isLoggedIn, playerStatusValidator, asyncHandler(getAllPlayers));
playerRouter.get('/stats', isLoggedIn, asyncHandler(getPlayerStats));
playerRouter.get('/revenue', isLoggedIn, dateValidator, asyncHandler(getDailyRevenue));
playerRouter.get('/:playerId', isLoggedIn, playerIdValidator, asyncHandler(getPlayerById));
playerRouter.put('/:playerId', isLoggedIn, updatePlayerValidator, asyncHandler(updatePlayer));

playerRouter.post('/:playerId/credits', isLoggedIn, addCreditsValidator, asyncHandler(addCredits));
playerRouter.get('/:playerId/transactions', isLoggedIn, playerIdValidator, asyncHandler(getPlayerTransactions));

export default playerRouter;