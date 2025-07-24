import { NextFunction, Request, Response } from "express";
import sessionService from "../services/session.service";

export const startSession = async (req: Request, res: Response, next: NextFunction) => {
  const { player_id, device_id, minutes } = req.body;
  const loungeId = req.superUser.loungeId;

  const response = await sessionService.startSession({
    loungeId,
    playerId: player_id,
    deviceId: device_id,
    minutes
  });

  next(response);
}

export const endSession = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const { ended_by, notes } = req.body;
  const loungeId = req.superUser.loungeId;

  const response = await sessionService.endSession({
    loungeId,
    sessionId,
    endedBy: ended_by,
    notes
  });

  next(response);
}

export const getAllActiveSessions = async (req: Request, res: Response, next: NextFunction) => {
  const loungeId = req.superUser.loungeId;
  const response = await sessionService.getAllActiveSessions({ loungeId });

  next(response);
};

export const getAllSessions = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.query;
  const loungeId = req.superUser.loungeId;

  const response = await sessionService.getAllSessions({
      loungeId,
      status: status as string
  });

    next(response);
};

export const getSessionById = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const loungeId = req.superUser.loungeId;

  const response = await sessionService.getSessionById({
      loungeId,
      sessionId
  });

  next(response);
};

export const updateSessionTime = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const { remaining_minutes } = req.body;
  const loungeId = req.superUser.loungeId;

  const response = await sessionService.updateSessionTime({
    loungeId,
    sessionId,
    remainingMinutes: remaining_minutes
  });

  next(response);
};

export const extendSession = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const { additional_minutes } = req.body;
  const { _id } = req.superUser;
  const loungeId = req.superUser.loungeId;

  const response = await sessionService.extendSession({
    loungeId,
    sessionId,
    additionalMinutes: additional_minutes,
    createdById: _id
  });

  next(response);
};

export const getSessionStats = async (req: Request, res: Response, next: NextFunction) => {
  const loungeId = req.superUser.loungeId;

  const response = await sessionService.getSessionStats({
    loungeId
  });

  next(response);
};

export const getSessionsByPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { playerId } = req.params;
    const loungeId = req.superUser.loungeId;

    const response = await sessionService.getSessionsByPlayer({
      loungeId,
      playerId
    });

    next(response);
};

export const getSessionsByDateRange = async (req: Request, res: Response, next: NextFunction) => {
  const { start_date, end_date } = req.query;
  const loungeId = req.superUser.loungeId;

  const response = await sessionService.getSessionsByDateRange({
    loungeId,
    startDate: new Date(start_date as string),
    endDate: new Date(end_date as string)
  });

  next(response);
};

export const forceEndSession = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const { reason } = req.body;
  const loungeId = req.superUser.loungeId;

  const response = await sessionService.endSession({
    loungeId,
    sessionId,
    endedBy: 'superuser',
    notes: reason || 'Force ended by super user'
  });

  next(response);
};

