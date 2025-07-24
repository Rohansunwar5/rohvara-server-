import { validateRequest } from '.';
import { isRequired, isMongoId, isIn, isNumeric, isMaxRequired } from '../../utils/validator.utils';

export const authenticatePlayerValidator = [
  isRequired('pc_id'),
  isRequired('username'),
  isRequired('password'),
  ...validateRequest
];

export const pcIdValidator = [
  isRequired('pcId'),
  ...validateRequest
];

export const updateStatusValidator = [
  isRequired('pcId'),
  isIn('status', ['available', 'in_use', 'offline', 'maintenance']),
  isNumeric('current_session_time', true),
  isMaxRequired({ key: 'game_launched', limit: 100, optional: true }),
  ...validateRequest
];

export const sessionLogoutValidator = [
  isRequired('pcId'),
  isMongoId('session_id'),
  ...validateRequest
];

export const reportErrorValidator = [
  isRequired('pcId'),
  isIn('error_type', ['critical', 'warning', 'info', 'hardware', 'software']),
  isMaxRequired({ key: 'error_message', limit: 500 }),
  isMongoId('session_id', true),
  ...validateRequest
];