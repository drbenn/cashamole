import { DeactivateTransactionDto, FetchTransactionsDto, TransactionDto, UpdateTransactionFieldDto } from '@common-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Pool } from 'pg';
import { PG_CONNECTION } from 'src/database/database.constants';

@Injectable()
export class TransactionQueryService {
  // Inject the singleton Pool instance
  constructor(
    @Inject(PG_CONNECTION) private pgPool: Pool,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async insertTransaction(dto: TransactionDto): Promise<TransactionDto> {
    const queryText = `
      INSERT INTO "transactions" (id, user_id, transaction_date, type, created_at, updated_at, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      dto.id,
      dto.user_id,
      dto.transaction_date,
      dto.type,
      dto.created_at,
      dto.updated_at,
      true
    ];

    try {
      const result = await this.pgPool.query(queryText, values);   
      const transaction: TransactionDto = result.rows[0]
      return transaction
    } catch (error) {
      this.logger.log('warn', `Error: transaction-query-service insertTransaction: ${error}`);
      throw new Error('Error: transaction-query-service insertTransaction');
    }
  }

  async getAllUserTransactions(dto: FetchTransactionsDto): Promise<TransactionDto[]> {
    const queryText = `
      SELECT * FROM transactions
      WHERE user_id = $1 AND active = $2;
    `;

    const values = [
      dto.user_id,
      true
    ];

    try {
      const result = await this.pgPool.query(queryText, values);   
      const transactions: TransactionDto[] = result.rows
      return transactions
    } catch (error) {
      this.logger.log('warn', `Error: transaction-query-service getAllUsersTransactions: ${error}`);
      throw new Error('Error: transaction-query-service getAllUsersTransactions');
    }
  }

  async updateTransactionField(dto: UpdateTransactionFieldDto): Promise<UpdateTransactionFieldDto> {
    const queryText = `
      UPDATE "transactions" 
      SET ${dto.field} = $1, updated_at = $2
      WHERE user_id = $3 AND id = $4 RETURNING *;`  

    const values = [
      dto.new_value,
      dto.updated_at,
      dto.user_id,
      dto.transaction_id,
    ];

    try {
      const result = await this.pgPool.query(queryText, values);   
      const transaction: TransactionDto = result.rows[0]
      const updatedTransaction: UpdateTransactionFieldDto = {
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        field: dto.field,
        new_value: dto.new_value,
        updated_at: transaction.updated_at!
      }
      return updatedTransaction
    } catch (error) {
      this.logger.log('warn', `Error: transaction-query-service updateTransactionField: ${error}`);
      throw new Error('Error: transaction-query-service updateTransactionField');
    }
  }

  async deactivateTransaction(dto: DeactivateTransactionDto): Promise<DeactivateTransactionDto> {
    const queryText = `
      UPDATE "transactions" 
      SET active = $1, updated_at = $2
      WHERE user_id = $3 AND id = $4 RETURNING *;`  

    const values = [
      false,
      dto.updated_at,
      dto.user_id,
      dto.transaction_id,
    ];

    try {
      const result = await this.pgPool.query(queryText, values);   
      const transaction: TransactionDto = result.rows[0]
      const deactivatedTransaction: DeactivateTransactionDto = { 
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        active: transaction.active,
        updated_at: transaction.updated_at!
      }
      return deactivatedTransaction
    } catch (error) {
      this.logger.log('warn', `Error: transaction-query-service deactivateTransaction: ${error}`);
      throw new Error('Error: transaction-query-service deactivateTransaction');
    }
  }
}
