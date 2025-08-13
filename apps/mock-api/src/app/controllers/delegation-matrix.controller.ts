import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ChequebookMakerCheckerResponse, DelegationResponse } from '../models/delegation-matrix.model';
import { DelegationMatrixService } from '../services/delegation-matrix.service';

@Controller('')
@UseGuards(JwtAuthGuard)
export class DelegationMatrixController {
  constructor(private readonly dService: DelegationMatrixService) {}

  @Post('product/product/request/list')
  @HttpCode(HttpStatus.OK)
  getChequeBookRequests(
    @Query('pageStart') pageStart = 0,
    @Query('pageSize') pageSize = 10,
    @Query('status') status?: string,
  ): DelegationResponse {
    return this.dService.getDelegationList({
      pageStart: Number(pageStart),
      pageSize: Number(pageSize),
      status: status ?? null,
    });
  }

  @Get('product/chequebook/workflow/status')
  @HttpCode(HttpStatus.OK)
  getProductsRequests(
    @Query('pageStart') pageStart = 0,
    @Query('pageSize') pageSize = 10,
    @Query('status') status?: string,
  ): DelegationResponse {
    return this.dService.getDelegationList({
      pageStart: Number(pageStart),
      pageSize: Number(pageSize),
      status: status ?? null,
    });
  }

  @Get('/product/chequebook/workflow/checker/status')
  @HttpCode(HttpStatus.OK)
  getChequebookCheckerRequests(
    @Query('pageStart') pageStart = 0,
    @Query('pageSize') pageSize = 10,
    @Query('status') status?: string,
  ): ChequebookMakerCheckerResponse {
    return this.dService.getChequebookCheckerList({
      pageStart: Number(pageStart),
      pageSize: Number(pageSize),
      status: status ?? null,
    });
  }

  @Post('/product/request/count/pending/maker')
  @HttpCode(HttpStatus.OK)
  withdraw(@Body('transactionId') transactionId: string) {
    return { message: 'withdraw successfully' };
  }

  @Get('product/product/request/count/pending')
  @HttpCode(HttpStatus.OK)
  getPendingProductCount() {
    return this.dService.getProductCount();
  }
  @Get('transfer/request/count/pending')
  @HttpCode(HttpStatus.OK)
  getPendingTransfersCount() {
    return this.dService.getProductCount();
  }
  @Get('chequebook/request/count/pending')
  @HttpCode(HttpStatus.OK)
  getPendingChequebookCount() {
    return this.dService.getProductCount();
  }

  @Get('product/product/request/fetch/lookup')
  @HttpCode(HttpStatus.OK)
  getRequestTypeLookup() {
    return this.dService.getRequestType();
  }
}
