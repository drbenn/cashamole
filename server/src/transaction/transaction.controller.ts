import { Body, Controller, Inject, Logger, Param, Patch, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common'
import { TransactionService } from './transaction.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import * as CommonTypes from '@common-types'
import { ProactiveRefreshGuard } from 'src/auth/jwt-guard/proactive-jwt.guard';
import { StripUserIdInterceptor } from 'src/interceptors/strip-user-id.interceptor';

@UseGuards(ProactiveRefreshGuard) // Applied to all controller endpoints
@UseInterceptors(StripUserIdInterceptor)
@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @Post()
  async createTransaction(
    @Body() dto: CommonTypes.TransactionDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.TransactionDto> {
    // 1. Get the VERIFIED user ID from the token payload
    const verifiedUserId = req.user.userId;
    const serviceDto: CommonTypes.ServiceTransactionDto = { ...dto, user_id: verifiedUserId }
    return await this.transactionService.createTransaction(serviceDto)
  }

  @Post('all-user')
  async allUserTransactions(
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.TransactionDto[]> {
    // 1. Get the VERIFIED user ID from the token payload
    const verifiedUserId = req.user.userId;
    return await this.transactionService.getAllUserTransactions(verifiedUserId)
  }

  @Patch()
  async updateTransactionField(
    @Body() dto: CommonTypes.UpdateTransactionFieldDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
    @Param() params: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.UpdateTransactionFieldDto> {
    // 1. Get the VERIFIED user ID from the token payload
    const verifiedUserId = req.user.userId;
    return await this.transactionService.updateTransactionField(dto, verifiedUserId)
  }

  @Patch('deactivate')
  async deactivateTransaction(
    @Body() dto: CommonTypes.DeactivateTransactionDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
    @Param() params: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.DeactivateTransactionDto> {
    // 1. Get the VERIFIED user ID from the token payload
    const verifiedUserId = req.user.userId;
    return await this.transactionService.deactivateTransaction(dto, verifiedUserId)
  }


}
