import { NextFunction, Request, Response } from 'express';
import memoryService from '../services/memory.service.';
import uploadService from '../services/upload.service';

export const createCustomMemoryGame = async (req: Request, res: Response, next: NextFunction) => {
  const {
    background, cards, cardsImage, challenges, collectUserDetails, colums, description, displayInstructions, favicon, fontFamily, instructions, leaderboard, leaderboardLimit, logo, movesLimit, rows, soundtrack, textSize, timerInSeconds, title,
  } = req.body;

  const response = await memoryService.createCustomMemoryGame({ background, cards, cardsImage, challenges, collectUserDetails, colums, description, displayInstructions, favicon, fontFamily, instructions, leaderboard, leaderboardLimit, logo, movesLimit, rows, soundtrack, textSize, timerInSeconds, title });

  next(response);
};

// export const getMemoryGame = async (req: Request, res: Response, next: NextFunction) => {
//   const { id } = req.params;
//   const ip = req.headers?.['x-forwarded-for'] || 'NaN';
//   const country = req.headers['cf-ipcountry'] || config.DEFAULT_COUNTRY_CODE;
//   const response = await memoryService.getMemoryGame({ country: typeof country === 'object' ? country[0] : country, memoryGameId: id, ip: typeof ip === 'object' ? ip[0] : ip });

//   next(response);
// };

export const uploadMemoryGameLogoImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'memory-game/logo';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

export const uploadMemoryGameFaviconImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'memory-game/favicon';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

export const uploadMemoryGameBackgroundImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'memory-game/background';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

export const uploadMemoryGameCardImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'memory-game/card';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

export const uploadMemoryGameCoverImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'memory-game/cover';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

export const uploadMemoryGameSoundtrack = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'memory-game/soundtrack';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

