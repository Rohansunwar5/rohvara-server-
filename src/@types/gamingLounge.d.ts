import 'express';

declare global {
  namespace Express {
    interface Request {
      user: {
        _id: string;
      };
      access_token: string | null;
      loungeId: string;
      superUser: {
        _id: string;
        loungeId: string;
      };
    }
  }
}