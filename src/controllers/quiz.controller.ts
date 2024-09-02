import { NextFunction, Request, Response } from 'express';
import quizService from '../services/quiz.service';
import uploadService from '../services/upload.service';
import config from '../config';

export const createCustomQuiz = async (req: Request, res: Response, next: NextFunction) => {
  const {
    leaderboard, leaderboardLimit, questions, background, title, fontFamily,
    textSize, description, timerInSeconds, instructions, displayInstructions, logo
  } = req.body;
  const response = await quizService.createCustomQuiz({ leaderboard, leaderboardLimit, questions, background, title, fontFamily, textSize, description, timerInSeconds, instructions, displayInstructions, logo });

  next(response);
};

export const updateCustomQuiz = async (req: Request, res: Response, next: NextFunction) => {
  const {
    leaderboard, leaderboardLimit, questions, background, description, fontFamily,
    textSize, title, timerInSeconds, instructions, displayInstructions, logo
  } = req.body;
  const { id } = req.params;
  const { _id } = req.user;
  const response = await quizService.updateCustomQuiz({ leaderboard, leaderboardLimit, questions, background, quizId: id, userId: _id, description, fontFamily, textSize, title, timerInSeconds, instructions, displayInstructions, logo });

  next(response);
};

export const getQuiz = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const ip = req.headers?.['x-forwarded-for'] || 'NaN';
  const country = req.headers['cf-ipcountry'] || config.DEFAULT_COUNTRY_CODE;

  const response = await quizService.getQuiz({ country: typeof country === 'object' ? country[0] : country, quizId: id, ip: typeof ip === 'object' ? ip[0] : ip });

  next(response);
};

export const addQuizToUserDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const { quizId } = req.params;
  const response = await quizService.addQuizToUserDashboard(_id, quizId);

  next(response);
};

export const uploadQuizBackgroundImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'quiz/background';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

export const uploadQuizLogoImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'quiz/logo';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

export const quizUserSession = async (req: Request, res: Response, next: NextFunction) => {
  const { quizId, fullName, email, score, duration } = req.body;
  const response = await quizService.quizUserSession({ quizId, fullName, email, score, duration });

  next(response);
};

export const quizLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  const { quizId } = req.params;
  const response = await quizService.quizLeaderboard(quizId);

  next(response);
};

export const checkUserSessionExists = async (req: Request, res: Response, next: NextFunction) => {
  const { quizId } = req.params;
  const email = req.query.email as string;
  const response = await quizService.checkUserSessionExists(quizId, email);

  next(response);
};
