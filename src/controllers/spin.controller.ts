import { NextFunction, Request, Response } from 'express';
import spinService from '../services/spin.service';
import uploadService from '../services/upload.service';
import config from '../config';

export const createCustomSpinTheWheel = async (req: Request, res: Response, next: NextFunction) => {
  const {
    segments, background, winnersOnly, instructions, description, title,
    displayInstructions, secondaryColor, textColor, logo, favicon
  } = req.body;
  const response = await spinService.createSpinTheWheel({ segments, background, winnersOnly, instructions, description, title, displayInstructions, secondaryColor, textColor, logo, favicon });

  next(response);
};

export const updateCustomSpinTheWheel = async (req: Request, res: Response, next: NextFunction) => {
  const {
    segments, background, winnersOnly, instructions, description, title,
    displayInstructions, secondaryColor, textColor, logo, favicon
  } = req.body;
  const { _id } = req.user;
  const { id } = req.params;
  const response = await spinService.updateCustomSpinTheWheel({ segments, background, winnersOnly, spinTheWheelId: id, userId: _id, instructions, description, title, displayInstructions, secondaryColor, textColor, logo, favicon });

  next(response);
};

export const getSpinTheWheel = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const ip = req.headers?.['x-forwarded-for'] || 'NaN';
  const country = req.headers['cf-ipcountry'] || config.DEFAULT_COUNTRY_CODE;
  const response = await spinService.getSpinTheWheel({ country: typeof country === 'object' ? country[0] : country, spinTheWheelId: id, ip: typeof ip === 'object' ? ip[0] : ip });

  next(response);
};

export const uploadSpinTheWheelBackgroundImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'spin-the-wheel/background';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

export const uploadSpinTheWheelLogoImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'spin-the-wheel/logo';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};

export const uploadSpinTheWheelFaviconImage = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File;
  const bucket = 'spin-the-wheel/favicon';
  const response = await uploadService.uploadToS3(file, bucket);

  next(response);
};


export const addSpinTheWheelToUserDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const { spinTheWheelId } = req.params;
  const response = await spinService.addSpinTheWheelToUserDashboard(_id, spinTheWheelId);

  next(response);
};

export const spinTheWheelUserSession = async (req: Request, res: Response, next: NextFunction) => {
  const { spinTheWheelId, fullName, email, prize, isWinner } = req.body;
  const response = await spinService.spinTheWheelUserSession({ prize, spinTheWheelId, email, fullName, isWinner });

  next(response);
};

export const checkSpinTheWheelUserSessionExists = async (req: Request, res: Response, next: NextFunction) => {
  const { spinTheWheelId } = req.params;
  const email = req.query.email as string;
  const response = await spinService.checkSpinTheWheelUserSessionExists(spinTheWheelId, email);

  next(response);
};

