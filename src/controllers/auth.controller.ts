import { NextFunction, Request, Response } from 'express';
import authService from '../services/auth.service';
import uploadService from '../services/upload.service';

export const genericLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const response = await authService.login({ email, password });

  next(response);
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, isdCode, phoneNumber, email, password } = req.body;
  const response = await authService.signup({ firstName, lastName, isdCode, phoneNumber, email, password });

  next(response);
};

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const response = await authService.profile(_id);

  next(response);
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const { firstName, lastName, isdCode, phoneNumber, bio, location, company, socials } = req.body;
  const response = await authService.updateProfile({ firstName, lastName, isdCode, phoneNumber, _id, bio, location, company, socials });

  next(response);
};

export const uploadProfileImage = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const file = req.file as Express.Multer.File;
  const bucket = 'uploads/profile';
  const { fileName } = await uploadService.uploadToS3(file, bucket, _id);
  const response = await authService.updateProfileImage(_id, fileName);

  next(response);
};

export const resendVerificationLink = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const response = await authService.resendVerificationLink(_id);

  next(response);
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.params;
  const response = await authService.verifyEmail(code);

  next(response);
};

export const generateResetPasswordLink = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  const response = await authService.generateResetPasswordLink(email);

  next(response);
};

export const verifyResetPasswordCode = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.params;
  const response = await authService.verifyResetPasswordCode(code);

  next(response);
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.params;
  const { password } = req.body;
  const response = await authService.resetPassword(code, password);

  next(response);
};

export const sso = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;
  const response = await authService.sso(code);

  next(response);
};

export const generateAccountDeletionCode = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const response = await authService.generateAccountDeletionCode(_id);

  next(response);
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;
  const { _id } = req.user;
  const response = await authService.deleteAccount(code, _id);

  next(response);
};

