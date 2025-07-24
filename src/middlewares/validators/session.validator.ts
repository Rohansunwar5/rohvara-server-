import { validateRequest } from '.';
import { isRequired, isMongoId, isIn, isGreaterThanZero, isMaxRequired } from '../../utils/validator.utils';

export const startSessionValidator = [
  isMongoId('player_id'),
  isMongoId('device_id'),
  isGreaterThanZero({ key: 'minutes' }),
  ...validateRequest
];

export const endSessionValidator = [
  isMongoId('sessionId'),
  isIn('ended_by', ['player', 'superuser', 'timeout', 'system']),
  isMaxRequired({ key: 'notes', limit: 500, optional: true }),
  ...validateRequest
];

export const updateSessionTimeValidator = [
  isMongoId('sessionId'),
  isGreaterThanZero({ key: 'remaining_minutes', allowZero: true }),
  ...validateRequest
];

export const extendSessionValidator = [
  isMongoId('sessionId'),
  isGreaterThanZero({ key: 'additional_minutes' }),
  ...validateRequest
];

export const sessionIdValidator = [
  isMongoId('sessionId'),
  ...validateRequest
];

export const playerIdValidator = [
  isMongoId('playerId'),
  ...validateRequest
];

export const sessionStatusValidator = [
  isIn('status', ['active', 'completed', 'terminated', 'expired'], true),
  ...validateRequest
];

export const dateRangeValidator = [
  isRequired('start_date'),
  isRequired('end_date'),
  ...validateRequest
];

export const forceEndSessionValidator = [
  isMongoId('sessionId'),
  isMaxRequired({ key: 'reason', limit: 200, optional: true }),
  ...validateRequest
];