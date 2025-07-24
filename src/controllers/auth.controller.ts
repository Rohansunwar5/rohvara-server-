import { NextFunction, Request, Response } from "express";
import authService from "../services/auth.service";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  const response = await authService.login({ username, password });

  next(response);
}

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password, email, lounge_name } = req.body;
  const response = await authService.signup({ username, password, email, lounge_name });

  next(response);
}

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const response = await authService.profile(_id);
  
  next(response);
}