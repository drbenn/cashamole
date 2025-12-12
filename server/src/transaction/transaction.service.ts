import { Inject, Injectable, Logger } from '@nestjs/common';
import { TransactionQueryService } from './transaction-query.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DeactivateTransactionDto, FetchTransactionsDto, TransactionDto, UpdateTransactionFieldDto } from '@common-types';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionQueryService: TransactionQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async createTransaction(dto: TransactionDto): Promise<TransactionDto> {
    return await this.transactionQueryService.insertTransaction(dto)
  }

  async getAllUserTransactions(dto: FetchTransactionsDto): Promise<TransactionDto[]> {
    return await this.transactionQueryService.getAllUserTransactions(dto)
  }

  async updateTransactionField(dto: UpdateTransactionFieldDto): Promise<UpdateTransactionFieldDto> {
    return await this.transactionQueryService.updateTransactionField(dto)
  }

  async deactivateTransaction(dto: DeactivateTransactionDto): Promise<DeactivateTransactionDto> {
    return await this.transactionQueryService.deactivateTransaction(dto)
  }
}
