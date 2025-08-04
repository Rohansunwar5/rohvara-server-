import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { addGameToDevice, checkDeviceExists, getAllDevices, getDeviceById, getDeviceStats, getOfflineDevices, registerDevice, registerDiscoveredDevice, registerMultipleDevices, removeGameFromDevice, updateDevice, updateDeviceStatus, updateHeartbeat } from '../controllers/device.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import { addGameValidator, deviceIdValidator, deviceStatusValidator, minutesOfflineValidator, pcIdValidator, registerDeviceValidator, removeGameValidator, updateDeviceStatusValidator, updateDeviceValidator } from '../middlewares/validators/device.validator';

const deviceRouter = Router();

deviceRouter.post('/', isLoggedIn, registerDeviceValidator, asyncHandler(registerDevice));
deviceRouter.get('/', isLoggedIn, deviceStatusValidator, asyncHandler(getAllDevices));
deviceRouter.get('/stats', isLoggedIn, asyncHandler(getDeviceStats));
deviceRouter.get('/offline', isLoggedIn, minutesOfflineValidator, asyncHandler(getOfflineDevices));
deviceRouter.get('/:deviceId', isLoggedIn, deviceIdValidator, asyncHandler(getDeviceById));
deviceRouter.put('/:deviceId', isLoggedIn, updateDeviceValidator, asyncHandler(updateDevice));

deviceRouter.put('/:deviceId/status', isLoggedIn, updateDeviceStatusValidator, asyncHandler(updateDeviceStatus));
deviceRouter.post('/:pcId/heartbeat', isLoggedIn, pcIdValidator, asyncHandler(updateHeartbeat));

deviceRouter.post('/:deviceId/games', isLoggedIn, addGameValidator, asyncHandler(addGameToDevice));
deviceRouter.delete('/:deviceId/games/:gameName', isLoggedIn, removeGameValidator, asyncHandler(removeGameFromDevice));

deviceRouter.post('/discovered/register', isLoggedIn, asyncHandler(registerDiscoveredDevice));
deviceRouter.post('/discovered/bulk-register', isLoggedIn, asyncHandler(registerMultipleDevices));
deviceRouter.get('/check/exists', isLoggedIn, asyncHandler(checkDeviceExists));


export default deviceRouter;