import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ResponseModel } from '../../models/custom/common.response.model';
import { CoinService } from './coin.service';
@Controller()
export class CoinController {
  constructor(private readonly service: CoinService) {}
}
