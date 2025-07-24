import { validateRequest } from '.';
import { isRequired, isMaxRequired } from '../../utils/validator.utils';

export const signupValidator = [
  isRequired('username'),
  isRequired('password'),
  isRequired('lounge_name'),
  isRequired('email', true),
  ...validateRequest
];

export const loginValidator = [
  isRequired('username'),
  isRequired('password'),
  ...validateRequest
];