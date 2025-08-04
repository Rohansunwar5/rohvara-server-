import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';

import { getNetworkInfo, scanNetworkDevices, registerDiscoveredDevice, registerMultipleDevices } from '../controllers/network.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';

const networkRouter = Router();

networkRouter.get('/info', isLoggedIn, asyncHandler(getNetworkInfo));
networkRouter.post('/scan', isLoggedIn, asyncHandler(scanNetworkDevices));

networkRouter.post('/register-discovered', isLoggedIn, asyncHandler(registerDiscoveredDevice));
networkRouter.post('/bulk-register', isLoggedIn, asyncHandler(registerMultipleDevices));

export default networkRouter;