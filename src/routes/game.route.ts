import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { addQuizToUserDashboard, checkUserSessionExists, createCustomQuiz, getQuiz, quizLeaderboard, quizUserSession, updateCustomQuiz, uploadQuizBackgroundImage, uploadQuizLogoImage } from '../controllers/quiz.controller';
import { createCustomQuizValidator, createQuizSessionValidator, getQuizValidator, linkUserToQuizValidator } from '../middlewares/validators/quiz.validator';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import { upload, uploadAnyFile } from '../utils/multer.util';
import { addSpinTheWheelToUserDashboard, checkSpinTheWheelUserSessionExists, createCustomSpinTheWheel, getSpinTheWheel, spinTheWheelUserSession, updateCustomSpinTheWheel, uploadSpinTheWheelBackgroundImage, uploadSpinTheWheelFaviconImage, uploadSpinTheWheelLogoImage } from '../controllers/spin.controller';
import { createSpinTheWheelUserSessionValidator, getSpinTheWheelValidator, linkUserToSpinTheWheelValidator, spinTheWheelValidator } from '../middlewares/validators/spin.validator';
import { createCustomMemoryGame, uploadMemoryGameBackgroundImage, uploadMemoryGameCardImage, uploadMemoryGameCoverImage, uploadMemoryGameFaviconImage, uploadMemoryGameLogoImage, uploadMemoryGameSoundtrack } from '../controllers/memory.controller';
import { createCustomMemoryValidator } from '../middlewares/validators/memory.validator';

const gameRouter = Router();

// quiz game
gameRouter.post('/quiz', createCustomQuizValidator, asyncHandler(createCustomQuiz));
gameRouter.put('/quiz/upload-logo-image', upload.single('file'), asyncHandler(uploadQuizLogoImage));
gameRouter.patch('/quiz/:id', isLoggedIn, createCustomQuizValidator, asyncHandler(updateCustomQuiz));
gameRouter.get('/quiz/:id', getQuizValidator, asyncHandler(getQuiz));
gameRouter.patch('/quiz/link-user/:quizId', isLoggedIn, linkUserToQuizValidator, asyncHandler(addQuizToUserDashboard));
gameRouter.put('/quiz/upload-background-image', upload.single('file'), asyncHandler(uploadQuizBackgroundImage));
gameRouter.post('/quiz/user-session', createQuizSessionValidator, asyncHandler(quizUserSession));
gameRouter.get('/quiz/leaderboard/:quizId', asyncHandler(quizLeaderboard));
gameRouter.get('/quiz/check-user/:quizId', asyncHandler(checkUserSessionExists));

// spin-the-wheel game
gameRouter.post('/spin-the-wheel', spinTheWheelValidator, asyncHandler(createCustomSpinTheWheel));
gameRouter.put('/spin-the-wheel/upload-logo-image', upload.single('file'), asyncHandler(uploadSpinTheWheelLogoImage));
gameRouter.put('/spin-the-wheel/upload-favicon-image', upload.single('file'), asyncHandler(uploadSpinTheWheelFaviconImage));
gameRouter.patch('/spin-the-wheel/:id', isLoggedIn, spinTheWheelValidator, asyncHandler(updateCustomSpinTheWheel));
gameRouter.get('/spin-the-wheel/:id', getSpinTheWheelValidator, asyncHandler(getSpinTheWheel));
gameRouter.patch('/spin-the-wheel/link-user/:spinTheWheelId', isLoggedIn, linkUserToSpinTheWheelValidator, asyncHandler(addSpinTheWheelToUserDashboard));
gameRouter.put('/spin-the-wheel/upload-background-image', upload.single('file'), asyncHandler(uploadSpinTheWheelBackgroundImage));
gameRouter.post('/spin-the-wheel/user-session', createSpinTheWheelUserSessionValidator, asyncHandler(spinTheWheelUserSession));
gameRouter.get('/spin-the-wheel/check-user/:spinTheWheelId', asyncHandler(checkSpinTheWheelUserSessionExists));

// memory-game
gameRouter.post('/memory-game', createCustomMemoryValidator, asyncHandler(createCustomMemoryGame));
// gameRouter.get('/memory-game/:id', getMemoryGameValidator, asyncHandler(getSpinTheWheel));
gameRouter.put('/memory-game/upload-logo-image', upload.single('file'), asyncHandler(uploadMemoryGameLogoImage));
gameRouter.put('/memory-game/upload-favicon-image', upload.single('file'), asyncHandler(uploadMemoryGameFaviconImage));
gameRouter.put('/memory-game/upload-background-image', upload.single('file'), asyncHandler(uploadMemoryGameBackgroundImage));
gameRouter.put('/memory-game/card-image', upload.single('file'), asyncHandler(uploadMemoryGameCardImage));
gameRouter.put('/memory-game/cover-image', upload.single('file'), asyncHandler(uploadMemoryGameCoverImage));
gameRouter.put('/memory-game/soundtrack', uploadAnyFile.single('file'), asyncHandler(uploadMemoryGameSoundtrack));

export default gameRouter;