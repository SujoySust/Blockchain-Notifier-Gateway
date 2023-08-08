import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshTokenInput {
  @IsNotEmpty()
  @IsJWT()
  token: string;
}

export class Token {
  accessToken?: string;
  refreshToken?: string;
  expireAt?: Date;
}
