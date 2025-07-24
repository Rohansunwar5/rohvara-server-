import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { login, profile, signup,
} from '../controllers/auth.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';

const authRouter = Router();

authRouter.post('/login', asyncHandler(login));
authRouter.post('/signup', asyncHandler(signup));
authRouter.get('/profile', isLoggedIn, asyncHandler(profile));

export default authRouter;