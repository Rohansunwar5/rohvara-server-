import { NextFunction, Request, Response } from 'express';
import authService, { AuthService } from '../services/auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {

  const clientIP = AuthService.getClientIP(req);

  const { username, password } = req.body;
  // console.log(`🔐 Login attempt from IP: ${clientIP} for user: ${username}`);
  const response = await authService.login({ username, password, clientIP });

  next(response);
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  const clientIP = AuthService.getClientIP(req);
  const { username, password, email, lounge_name } = req.body;
  const response = await authService.signup({ username, password, email, lounge_name, clientIP });

  next(response);
};

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const response = await authService.profile(_id);

  next(response);
};