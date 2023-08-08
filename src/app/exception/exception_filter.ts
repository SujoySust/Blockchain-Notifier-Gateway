import { BadRequestException } from '@nestjs/common';
import { __, errorResponse } from '../helpers/functions';

export function throwNewError(message: string) {
  throw new BadRequestException(errorResponse(__(message)));
}
