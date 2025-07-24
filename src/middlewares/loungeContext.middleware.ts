import { Request, Response, NextFunction } from 'express';

export const extractLoungeContext = (req: Request, res: Response, next: NextFunction) => {
  // Super user ID becomes the lounge ID (tenant identifier)
  const { _id } = req.user;
  
  // Add loungeId to request
  req.loungeId = _id;
  
  // Create superUser object with loungeId
  req.superUser = {
    _id: _id,
    loungeId: _id
  };
  
  next();
};

