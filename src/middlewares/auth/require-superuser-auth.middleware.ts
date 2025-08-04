import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../errors/unauthorized.error';

const requireSuperUserAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    // Check if user is authenticated and has required properties
    if (!req.user || !req.user._id) {
      throw new UnauthorizedError('Super user authentication required');
    }

    // Additional check for lounge context
    if (!req.loungeId || !req.superUser) {
      throw new UnauthorizedError('Lounge context missing');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default requireSuperUserAuth;