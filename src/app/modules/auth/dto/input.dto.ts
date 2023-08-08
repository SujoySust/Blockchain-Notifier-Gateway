import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Unique } from '../../../../libs/decorators/unique.decorator';
import { __ } from '../../../helpers/functions';
import { Match } from '../../../../libs/decorators/match.decorator';

export class SignupInput {
  @IsNotEmpty({
    message: () => __('Email is required'),
  })
  @IsEmail()
  @Unique('User', {
    message: () => __('Email already used.'),
  })
  email: string;
  username?: string;
  @Matches(
    /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    {
      message: () =>
        __(
          'Password too weak. Use combination of number, alphabet and special character.',
        ),
    },
  )
  @MinLength(8)
  @MaxLength(20)
  @IsNotEmpty({
    message: () => __('Password can not be empty'),
  })
  password: string;

  @Match('password', {
    message: () => __('Password and confirm password should be same'),
  })
  @MinLength(8)
  @IsNotEmpty({
    message: () => __('Confirm password can not be empty'),
  })
  password_confirm: string;
}

export class LoginInput {
  @IsNotEmpty({
    message: () => __('Email is required'),
  })
  email: string;
  @IsNotEmpty({
    message: () => __('Password is required'),
  })
  password: string;
}
