import { ExecutionContext, UnauthorizedException, mixin } from '@nestjs/common';
import { __, errorResponse } from '../../app/helpers/functions';
import { AuthGuard } from '@nestjs/passport';
import { USER_STATUS } from '../../app/helpers/coreconstant';

export function JwtAuthGuard() {
  class MixingAuthGuard extends AuthGuard('jwt') {
    handleRequest(
      err: any,
      userInfo: any,
      info: any,
      context: ExecutionContext,
    ) {
      const request = context.switchToHttp().getRequest();
      if (err || !userInfo) {
        throw err || new UnauthorizedException();
      } else {
        const { user } = userInfo;
        if (!user) throw new UnauthorizedException();
        request.user = user;
        return this.checkStatusAndGetUser(user);
      }
    }

    checkStatusAndGetUser(user: any) {
      if (user.status == USER_STATUS.ACTIVE) return user;
      else if (user.status == USER_STATUS.SUSPENDED)
        throw new UnauthorizedException(
          errorResponse(__('The account is suspended. Contact to support')),
        );
      else if (user.status == USER_STATUS.DISABLED)
        throw new UnauthorizedException(
          errorResponse(__('The account is disabled. Contact to support')),
        );
      else if (user.status == USER_STATUS.INACTIVE)
        throw new UnauthorizedException(
          errorResponse(__('The account is not active. Contact to support')),
        );
    }
  }
  const guard = mixin(MixingAuthGuard);
  return guard;
}
