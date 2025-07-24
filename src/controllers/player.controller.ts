import { NextFunction, Response, Request } from 'express';
import playerService from '../services/player.service';

export const createPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password, display_name, phone } = req.body;
    const { _id } = req.superUser;
    const loungeId = req.superUser.loungeId;

    const response = await playerService.createplayer({ loungeId, username, password, display_name, phone, createdById: _id });

    next(response);
};

export const addCredits = async (req: Request, res: Response, next: NextFunction) => {
    const { playerId } = req.params;
    const { minutes, price } = req.body;
    const { _id } = req.superUser;
    const loungeId = req.superUser.loungeId;

    const response = await playerService.addCredits({
        loungeId, playerId, minutes, price, createdById: _id});

    next(response);
};

export const getAllPlayers = async (req: Request, res: Response, next: NextFunction) => {
    const { status } = req.query;
    const loungeId = req.superUser.loungeId;

    const response = await playerService.getAllPlayers({ loungeId, status: status as string });

    next(response);
};

export const getPlayerById = async (req: Request, res: Response, next: NextFunction) => {
  const { playerId } = req.params;
  const loungeId = req.superUser.loungeId;

  const response = await playerService.getPlayerById({
    loungeId,
    playerId
  });

  next(response);
};

export const getPlayerStats = async (req: Request, res: Response, next: NextFunction) => {
  const loungeId = req.superUser.loungeId;

  const response = await playerService.getPlayerStats({
    loungeId
  });

  next(response);
};

export const updatePlayer = async (req: Request, res: Response, next: NextFunction) => {
  const { playerId } = req.params;
  const { display_name, phone, status } = req.body;
  const loungeId = req.superUser.loungeId;

  const response = await playerService.updatePlayer({
    loungeId,
    playerId,
    display_name,
    phone,
    status
  });

  next(response);
};


export const getPlayerTransactions = async (req: Request, res: Response, next: NextFunction) => {
  const { playerId } = req.params;
  const loungeId = req.superUser.loungeId;

  const response = await playerService.getPlayerTransactions({
    loungeId,
    playerId
  });

  next(response);
};

export const getDailyRevenue = async (req: Request, res: Response, next: NextFunction) => {
  const { date } = req.query;
  const loungeId = req.superUser.loungeId;

  const response = await playerService.getDailyRevenue({ loungeId, date: date ? new Date(date as string) : new Date()});

  next(response);
};