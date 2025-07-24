import { validateRequest } from '.';
import { isRequired, isMongoId, isNumeric, isIn, isGreaterThanZero } from '../../utils/validator.utils';

export const createPlayerValidator = [
  isRequired('username'),
  isRequired('password'),
  isRequired('display_name', true),
  isRequired('phone', true),
  ...validateRequest
];

export const addCreditsValidator = [
  isMongoId('playerId'),
  isGreaterThanZero({ key: 'minutes' }),
  isGreaterThanZero({ key: 'price' }),
  ...validateRequest
];

export const updatePlayerValidator = [
  isMongoId('playerId'),
  isRequired('display_name', true),
  isRequired('phone', true),
  isIn('status', ['active', 'suspended', 'banned'], true),
  ...validateRequest
];

export const playerIdValidator = [
  isMongoId('playerId'),
  ...validateRequest
];

export const playerStatusValidator = [
  isIn('status', ['active', 'suspended', 'banned'], true),
  ...validateRequest
];

export const dateValidator = [
  isRequired('date', true),
  ...validateRequest
];