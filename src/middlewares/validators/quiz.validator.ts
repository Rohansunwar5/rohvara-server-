import { validateRequest } from '.';
import { isArray, isBoolean, isMongoId, isNumeric, isRequired } from '../../utils/validator.utils';

export const getQuizValidator = [
  isMongoId('id'),
  ...validateRequest
];

export const linkUserToQuizValidator = [
  isMongoId('quizId'),
  ...validateRequest
];

export const createCustomQuizValidator = [
  isRequired('questions.*.question'),
  isArray('questions.*.options'),
  isRequired('questions.*.correctOptionValue'),
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
  ...validateRequest
];

export const createQuizSessionValidator = [
  isRequired('quizId'),
  isRequired('fullName'),
  isRequired('email'),
  isRequired('score'),
  isRequired('duration'),
  ...validateRequest
];