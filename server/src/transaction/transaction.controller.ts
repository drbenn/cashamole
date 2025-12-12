import { Body, Controller, Get, Inject, Logger, Param, Patch, Post, Proppatch, Req, Res } from '@nestjs/common'
import { TransactionService } from './transaction.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import * as CommonTypes from '@common-types'

@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @Post()
  async createTransaction(
    @Body() dto: CommonTypes.TransactionDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.TransactionDto> {
    return await this.transactionService.createTransaction(dto)
  }

  @Post('all-user')
  async allUserTransactions(
    @Body() dto: CommonTypes.FetchTransactionsDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.TransactionDto[]> {
    return await this.transactionService.getAllUserTransactions(dto)
  }

  @Patch(':id')
  async updateTransactionField(
    @Body() dto: CommonTypes.UpdateTransactionFieldDto,
    @Req() req: Request,
    @Param() params: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.UpdateTransactionFieldDto> {
    const transactionId: string = params.id
    return await this.transactionService.updateTransactionField(dto)
  }

  @Patch('deactivate/:id')
  async deactivateTransaction(
    @Body() dto: CommonTypes.DeactivateTransactionDto,
    @Req() req: Request,
    @Param() params: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.DeactivateTransactionDto> {
    const transactionId: string = params.id
    return await this.transactionService.deactivateTransaction(dto)
  }


}
