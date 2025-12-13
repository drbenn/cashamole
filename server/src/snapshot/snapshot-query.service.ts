import { CreateSnapshotHeaderApiDto, CreateSnapshotHeaderDto, SnapshotHeaderDto } from '@common-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Pool } from 'pg';
import { PG_CONNECTION } from 'src/database/database.constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SnapshotQueryService {
  // Inject the singleton Pool instance
  constructor(
    @Inject(PG_CONNECTION) private pgPool: Pool,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
/**
   * Checks if a snapshot header already exists for a given user on a specific date.
   */
  async findHeaderByDateAndUser(dto: CreateSnapshotHeaderApiDto): Promise<SnapshotHeaderDto | null> {
    console.log('f sd: ', dto.snapshot_date);

    const dateString = dto.snapshot_date.toISOString().split('T')[0];
    
    const sql = `
      SELECT id, user_id, snapshot_date, created_at
      FROM snapshot_headers
      WHERE user_id = $1 AND snapshot_date = $2;
    `;
    
    try {
      const result = await this.pgPool.query(sql, [dto.user_id, dateString]);
      
      if (result.rows.length > 0) {
        this.logger.warn(
          `Existing snapshot found for user ${dto.user_id} on date ${dateString}`, 
          SnapshotQueryService.name
        );
        // Return the existing header to prevent duplicate creation
        return result.rows[0] as SnapshotHeaderDto;
      }
      
      return null;
    } catch (error) {
      this.logger.error(
        `DB Error checking existing snapshot: ${error.message}`, 
        SnapshotQueryService.name, 
        error.stack
      );
      throw new Error('Database error during uniqueness check.');
    }
  }

  /**
   * Inserts a new snapshot header into the database.
   */
  async createHeader(dto: CreateSnapshotHeaderApiDto): Promise<SnapshotHeaderDto> {

    const id = uuidv4()
    const dateString = dto.snapshot_date.toISOString().split('T')[0];

    const sql = `
      INSERT INTO snapshot_headers (id, user_id, snapshot_date)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, snapshot_date, created_at;
    `;
    
    try {
      const result = await this.pgPool.query(sql, [id, dto.user_id, dateString]);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create snapshot header in database.');
      }

      this.logger.log(
        `New snapshot header created (ID: ${result.rows[0].id}) for user ${dto.user_id} on ${dto.snapshot_date}`, 
        SnapshotQueryService.name
      );
      
      return result.rows[0] as SnapshotHeaderDto;
    } catch (error) {
      this.logger.error(
        `DB Error creating snapshot header: ${error.message}`, 
        SnapshotQueryService.name, 
        error.stack
      );
      throw new Error('Database error during snapshot header creation.');
    }
  }
}