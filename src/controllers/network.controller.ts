import { NextFunction, Request, Response } from 'express';
import networkService from '../services/network.service';

export const getNetworkInfo = async (req:Request, res: Response, next: NextFunction) => {
    const userId = req.superUser._id;
    const response = await networkService.getNetworkInfo({ userId });

    next(response);
};

export const scanNetworkDevices = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.superUser._id;
    const loungeId = req.superUser.loungeId;

    const response = await networkService.scanNetworkDevices({ userId, loungeId });

    next(response);
};

export const registerDiscoveredDevice = async (req: Request, res: Response, next: NextFunction) => {
    const { pc_id, pc_name, ip_address, mac_address, specs } = req.body;
    const loungeId = req.superUser.loungeId;

    const response = await networkService.registerDiscoveredDevice({ loungeId, pc_id, pc_name, ip_address, mac_address, specs });

    next(response);
};

export const registerMultipleDevices = async (req: Request, res: Response, next: NextFunction) => {
    const { devices } = req.body;
    const loungeId = req.superUser.loungeId;

    const response = await networkService.registerMultipleDevices({ loungeId, devices });

    next(response);
};