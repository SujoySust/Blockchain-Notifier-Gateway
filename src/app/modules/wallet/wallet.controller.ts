import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ResponseModel } from '../../models/custom/common.response.model';
import { WalletService } from './wallet.service';
import { WalletCreateInput } from './dto/input.dto';
import { JwtAuthGuard } from '../../../libs/auth/auth.gaurd';
import { User } from '../../models/db/user.model';
import { UserEntity } from '../../../libs/decorators/user.decorator';
@Controller('wallets')
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @UseGuards(JwtAuthGuard())
  @Post('create')
  async create(
    @Body() payload: WalletCreateInput,
    @UserEntity() user: User,
  ): Promise<ResponseModel> {
    return await this.service.createWallet(payload, user);
  }
}
