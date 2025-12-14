import { Inject, Injectable, Logger } from '@nestjs/common';
import { TransactionQueryService } from './transaction-query.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DeactivateTransactionDto, ServiceTransactionDto, TransactionDto, UpdateTransactionFieldDto } from '@common-types';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionQueryService: TransactionQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async createTransaction(dto: ServiceTransactionDto): Promise<TransactionDto> {
    return await this.transactionQueryService.insertTransaction(dto)
  }

  async getAllUserTransactions(userId: string): Promise<TransactionDto[]> {
    return await this.transactionQueryService.getAllUserTransactions(userId)
  }

  async updateTransactionField(dto: UpdateTransactionFieldDto, userId: string): Promise<UpdateTransactionFieldDto> {
    return await this.transactionQueryService.updateTransactionField(dto, userId)
  }

  async deactivateTransaction(dto: DeactivateTransactionDto, userId: string): Promise<DeactivateTransactionDto> {
    return await this.transactionQueryService.deactivateTransaction(dto, userId)
  }
}
