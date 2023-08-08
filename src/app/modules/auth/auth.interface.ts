import { ResponseModel } from '../../models/custom/common.response.model';
import { User } from '../../models/db/user.model';
import { LoginInput, SignupInput } from './dto/input.dto';
import { LoginResponse } from './dto/response.dto';

export interface AuthServiceInterface {
  signup(payload: SignupInput): Promise<ResponseModel>;
  login(payload: LoginInput): Promise<LoginResponse>;
  getUserByIdentifier(
    authIdentifier: string | number | bigint,
    loginSecret?: string,
  ): Promise<User>;
  getUserFromToken(token: string): Promise<User>;
  refreshToken(token: string): LoginResponse;
}
