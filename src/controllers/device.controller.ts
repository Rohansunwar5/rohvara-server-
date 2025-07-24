import { NextFunction, Request, Response } from "express";
import deviceService from "../services/device.service";

export const registerDevice = async (req:Request, res: Response, next: NextFunction) => {
  const { pc_id, pc_name, ip_address, mac_address, specs } = req.body;
  const { _id } = req.superUser;
  const loungeId = req.superUser.loungeId;

  const response = await deviceService.registerDevice({ loungeId, pc_id, pc_name, ip_address, mac_address, specs });

  next(response);

}

export const getAllDevices = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.query;
  const loungeId = req.superUser.loungeId;

  const response = await deviceService.getAllDevices({ loungeId, status: status as string });

  next(response);
}

export const getDeviceById = async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId } = req.params;
  const loungeId = req.superUser.loungeId;

  const response = await deviceService.getDeviceById({
      loungeId,
      deviceId
  });

  next(response);
};

export const updateDevice = async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId } = req.params;
  const { pc_name, ip_address, mac_address, specs } = req.body;
  const loungeId = req.superUser.loungeId;

  const response = await deviceService.updateDevice({ loungeId, deviceId, pc_name, ip_address, mac_address, specs });

  next(response);
};

export const updateDeviceStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId } = req.params;
  const { status, current_user_id, current_session_id } = req.body;
  const loungeId = req.superUser.loungeId;

  const response = await deviceService.updateDeviceStatus({ loungeId, deviceId, status, current_user_id, current_session_id });

  next(response);
};

export const addGameToDevice = async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId } = req.params;
  const { name, executable, icon_path } = req.body;
  const loungeId = req.superUser.loungeId;

  const response = await deviceService.addGameToDevice({ loungeId, deviceId, name, executable, icon_path });

  next(response);
};

export const removeGameFromDevice = async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId, gameName } = req.params;
  const loungeId = req.superUser.loungeId;

  const response = await deviceService.removeGameFromDevice({ loungeId, deviceId, gameName });

  next(response);
};

export const getDeviceStats = async (req: Request, res: Response, next: NextFunction) => {
    const loungeId = req.superUser.loungeId;

    const response = await deviceService.getDeviceStats({
        loungeId
    });

    next(response);
};

export const updateHeartbeat = async (req: Request, res: Response, next: NextFunction) => {
    const { pcId } = req.params;
    const loungeId = req.superUser.loungeId;

    const response = await deviceService.updateHeartbeat({
        loungeId,
        pcId
    });

    next(response);
};

export const getOfflineDevices = async (req: Request, res: Response, next: NextFunction) => {
    const { minutesOffline } = req.query;
    const loungeId = req.superUser.loungeId;

    const response = await deviceService.getOfflineDevices({
        loungeId,
        minutesOffline: minutesOffline ? Number(minutesOffline) : undefined
    });

    next(response);
};
