// verify-superuser-token.middleware.ts
import JWT from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../errors/bad-request.error';
import { UnauthorizedError } from '../../errors/unauthorized.error';
import SuperUser from '../../models/superUser.model';

interface IJWTVerifyPayload {
  userId: string;
}

const getSuperUserAuthMiddlewareByJWTSecret = (jwtSecret: string) => async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestError('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) throw new BadRequestError('Token is missing or invalid');

    const { userId } = JWT.verify(token, jwtSecret) as IJWTVerifyPayload;
    if (!userId) throw new UnauthorizedError('Invalid token payload');

    // Verify super user exists
    const superUser = await SuperUser.findById(userId);
    if (!superUser) {
      throw new UnauthorizedError('Super user not found');
    }

    // Set all required properties at once
    req.user = {
      _id: userId,
    };

    req.access_token = token;
    req.loungeId = userId;
    req.superUser = {
      _id: userId,
      loungeId: userId
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default getSuperUserAuthMiddlewareByJWTSecret;