import { validateRequest } from '.';
import { isRequired, isMongoId, isIn, isMaxRequired, isNumeric } from '../../utils/validator.utils';

export const registerDeviceValidator = [
  isRequired('pc_id'),
  isRequired('pc_name'),
  isRequired('ip_address'),
  isRequired('mac_address', true),
  isMaxRequired({ key: 'specs.ram', limit: 20, optional: true }),
  isMaxRequired({ key: 'specs.gpu', limit: 50, optional: true }),
  isMaxRequired({ key: 'specs.cpu', limit: 50, optional: true }),
  ...validateRequest
];

export const updateDeviceValidator = [
  isMongoId('deviceId'),
  isRequired('pc_name', true),
  isRequired('ip_address', true),
  isRequired('mac_address', true),
  ...validateRequest
];

export const updateDeviceStatusValidator = [
  isMongoId('deviceId'),
  isIn('status', ['available', 'in_use', 'offline', 'maintenance']),
  isMongoId('current_user_id', true),
  isMongoId('current_session_id', true),
  ...validateRequest
];

export const addGameValidator = [
  isMongoId('deviceId'),
  isRequired('name'),
  isRequired('executable'),
  isMaxRequired({ key: 'icon_path', limit: 300, optional: true }),
  ...validateRequest
];

export const removeGameValidator = [
  isMongoId('deviceId'),
  isRequired('gameName'),
  ...validateRequest
];

export const deviceIdValidator = [
  isMongoId('deviceId'),
  ...validateRequest
];

export const pcIdValidator = [
  isRequired('pcId'),
  ...validateRequest
];

export const deviceStatusValidator = [
  isIn('status', ['available', 'in_use', 'offline', 'maintenance'], true),
  ...validateRequest
];

export const minutesOfflineValidator = [
  isNumeric('minutesOffline', true),
  ...validateRequest
];