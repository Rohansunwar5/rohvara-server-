import { validateRequest } from '.';
import { isRequired, isArray, isBoolean, isNumeric, isMongoId } from '../../utils/validator.utils';

export const createCustomMemoryValidator = [
  isRequired('background.backgroundColor', true),
  isRequired('background.primaryBColor', true),
  isRequired('background.secondaryBColor', true),
  isRequired('background.textColor', true),
  isRequired('background.image', true),
  isBoolean('leaderboard', true),
  isNumeric('leaderboardLimit', true),
  isRequired('fontFamily'),
  isRequired('textSize'),
  isRequired('title'),
  isRequired('description'),
  isRequired('timerInSeconds'),
  isArray('instructions', true),
  isBoolean('displayInstructions'),
  isRequired('logo.image', true),
  isRequired('logo.websiteUrl', true),
  isRequired('favicon', true),
  isRequired('colums'),
  isRequired('rows'),
  isArray('cardsImage'),
  isRequired('challenges'),
  isRequired('movesLimit', true),
  isRequired('soundtrack.enabled'),
  isRequired('soundtrack.file', true),
  isRequired('cards.insideColor'),
  isRequired('cards.coverType'),
  isRequired('cards.coverColor', true),
  isRequired('cards.coverImage', true),
  isRequired('collectUserDetails'),
  ...validateRequest
];

export const getMemoryGameValidator = [
  isMongoId('id'),
  ...validateRequest
];