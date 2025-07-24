import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../errors/unauthorized.error';

const requireSuperUserAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // Check if user is authenticated and has required properties
  if (!req.user || !req.user._id) {
    throw new UnauthorizedError('Super user authentication required');
  }

  // Additional check for lounge context (since we're setting it in auth middleware)
  if (!req.loungeId || !req.superUser) {
    throw new UnauthorizedError('Lounge context missing');
  }

  next();
};

export default requireSuperUserAuth;