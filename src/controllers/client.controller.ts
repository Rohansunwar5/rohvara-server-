import { NextFunction, Request, Response } from 'express';
import clientService from '../services/client.service';

export const authenticatePlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { pc_id, username, password } = req.body;

    const response = await clientService.authenticatePlayer({
        pcId: pc_id,
        username,
        password
    });

    next(response);
};

export const checkCommands = async (req: Request, res: Response, next: NextFunction) => {
    const { pcId } = req.params;

    const response = await clientService.checkCommands({
        pcId
    });

    next(response);
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { pcId } = req.params;
    const { status, current_session_time, game_launched } = req.body;

    const response = await clientService.updateStatus({
        pcId,
        status,
        currentSessionTime: current_session_time,
        gameLaunched: game_launched
    });

    next(response);
};

// export const getAvailableGames = async (req: Request, res: Response, next: NextFunction) => {
//     const { pcId } = req.params;

//     const response = await clientService.getAvailableGames({
//         pcId
//     });

//     next(response);
// };

export const updateHeartbeat = async (req: Request, res: Response, next: NextFunction) => {
    const { pcId } = req.params;

    const response = await clientService.updateHeartbeat({
        pcId
    });

    next(response);
};

export const sessionLogout = async (req: Request, res: Response, next: NextFunction) => {
    const { pcId } = req.params;
    const { session_id } = req.body;

    const response = await clientService.sessionLogout({
        pcId,
        sessionId: session_id
    });

    next(response);
};

export const reportError = async (req: Request, res: Response, next: NextFunction) => {
    const { pcId } = req.params;
    const { error_type, error_message, session_id } = req.body;

    const response = await clientService.reportError({
        pcId,
        errorType: error_type,
        errorMessage: error_message,
        sessionId: session_id
    });

    next(response);
};