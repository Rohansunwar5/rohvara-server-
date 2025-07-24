import config from '../config';
import requireSuperUserAuth from './auth/require-superuser-auth.middleware';
import getSuperUserAuthMiddlewareByJWTSecret from './auth/verify-superuser-token.middleware';

const isLoggedIn = [
  getSuperUserAuthMiddlewareByJWTSecret(config.JWT_SECRET),
  requireSuperUserAuth,
];

export default isLoggedIn;
