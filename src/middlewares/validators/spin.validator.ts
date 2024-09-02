import { validateRequest } from '.';
import { isArray, isBoolean, isMongoId, isRequired } from '../../utils/validator.utils';

export const spinTheWheelValidator = [
  isRequired('segments.*.id'),
  isRequired('segments.*.prize'),
  isRequired('segments.*.weight'),
  isRequired('segments.*.color'),
  isRequired('segments.*.textColor'),
  isRequired('segments.*.isWin'),
  isRequired('background.hexCode', true),
  isRequired('background.textSize', true),
  isRequired('background.fontFamily', true),
  isRequired('background.image', true),
  isRequired('winnersOnly', true),
  isRequired('title'),
  isRequired('description'),
  isArray('instructions', true),
  isBoolean('displayInstructions'),
  isRequired('textColor'),
  isRequired('secondaryColor'),
  ...validateRequest
];

export const getSpinTheWheelValidator = [
  isMongoId('id'),
  ...validateRequest
];

export const linkUserToSpinTheWheelValidator = [
  isMongoId('spinTheWheelId'),
  ...validateRequest
];

export const createSpinTheWheelUserSessionValidator = [
  isRequired('spinTheWheelId'),
  isRequired('email'),
  isRequired('fullName', true),
  isRequired('prize'),
  isBoolean('isWinner'),
  ...validateRequest
];