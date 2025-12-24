import { ServiceCreateSnapshotLiabilityDto, SnapshotLiabilityDto } from '@common-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Pool } from 'pg';
import { PG_CONNECTION } from 'src/database/database.constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SnapshotLiabilityQueryService {
  // Inject the singleton Pool instance
  constructor(
    @Inject(PG_CONNECTION) private pgPool: Pool,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

// =================================================================
  // CREATE (MINIMAL FIELDS)
  // Purpose: Inserts a new, blank liability record.
  // =================================================================
  async createLiability(dto: ServiceCreateSnapshotLiabilityDto): Promise<SnapshotLiabilityDto> {
    const methodName = SnapshotLiabilityQueryService.name + '.createLiability';
    // We do NOT pass amount or entity_type. 
    // amount defaults to 0.00, entity_type defaults to 'liability' via DB schema.
    const sql = `
      INSERT INTO snapshot_liabilities 
        (id, snapshot_id, user_id, category_id, sort_order)
      VALUES (
        $1, $2, $3,
        (SELECT id FROM categories WHERE user_id = $3 AND name = 'Uncategorized' AND usage_type = 'liability' LIMIT 1), 
        (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM snapshot_liabilities WHERE snapshot_id = $2 AND user_id = $3)
      )
      RETURNING *;
    `;
    
    const id = uuidv4()
    const values = [id, dto.snapshot_id, dto.user_id];
    
    // Note: If an error occurs (e.g., FK constraint failure), it will be caught by the service layer.
    try {
      const result = await this.pgPool.query(sql, values);
      return result.rows[0] as SnapshotLiabilityDto;
    } catch (error) {
      this.logger.error(`Error in ${methodName}: ${error.message}`);
      throw error;
    }
  }

  // =================================================================
  // UPDATE (PRECISE FIELD-LEVEL UPDATE)
  // Purpose: Updates a single field dynamically, with security checks.
  // =================================================================
  async updateLiability(
    liabilityId: string, 
    userId: string, 
    snapshotId: string, 
    field: string, 
    value: any
  ): Promise<SnapshotLiabilityDto | null> {
    
    // NOTE: Assume 'snapshot_liabilities' is the table name
    // CRITICAL: Use string interpolation for the column name (field) after validation, 
    // but parameterized slots ($1, $2, $3, $4) for all user-provided data (IDs, value).
    let sql = ``
    const values = [value, liabilityId, userId, snapshotId]; 

    if (field === 'category_id') {
      // Security subquery: user can change category, but only to one they own.
      sql = `
        UPDATE snapshot_liabilities
        SET category_id = $1, updated_at = NOW()
        WHERE id = $2 
          AND user_id = $3 
          AND snapshot_id = $4
          AND EXISTS (SELECT 1 FROM categories WHERE id = $1 AND user_id = $3)
        RETURNING *;
      `;
    } else {
      // Entity_type is BLOCKED in the controller, so it never hits this dynamic update.
      sql = `
        UPDATE snapshot_liabilities
        SET "${field}" = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3 AND snapshot_id = $4 AND active = TRUE
        RETURNING *;
      `;
    }

    try {
        const result = await this.pgPool.query(sql, values);
        return result.rows.length > 0 ? (result.rows[0] as SnapshotLiabilityDto) : null;
    } catch (error) {
        this.logger.error(`DB Error updating liability ID ${liabilityId} field ${field}: ${error.message}`, SnapshotLiabilityQueryService.name);
        throw error;
    }
  }

  // =================================================================
  // DEACTIVATE
  // Purpose: Sets the 'active' flag to FALSE (soft delete).
  // =================================================================
  async deactivateLiability(liabilityId: string, userId: string): Promise<SnapshotLiabilityDto | null> {
    const sql = `
      UPDATE snapshot_liabilities
      SET active = FALSE, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *; 
    `;
    
    const values = [liabilityId, userId];
    
    const result = await this.pgPool.query(sql, values);
    return result.rows.length > 0 ? (result.rows[0] as SnapshotLiabilityDto) : null;
  }
}
