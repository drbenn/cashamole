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
    const sql = `
      INSERT INTO snapshot_liability 
        (id, snapshot_id, user_id, category, active)
      VALUES ($1, $2, $3, 'liability', TRUE)
      RETURNING *;
    `;
    
    const id = uuidv4()
    const values = [id, dto.snapshot_id, dto.user_id];
    
    // Note: If an error occurs (e.g., FK constraint failure), it will be caught by the service layer.
    const result = await this.pgPool.query(sql, values);
    return result.rows[0] as SnapshotLiabilityDto;
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
    
    // NOTE: Assume 'snapshot_liability' is the table name
    // CRITICAL: Use string interpolation for the column name (field) after validation, 
    // but parameterized slots ($1, $2, $3, $4) for all user-provided data (IDs, value).
    const sql = `
      UPDATE snapshot_liability
      SET 
        "${field}" = $4,
        updated_at = NOW()
      WHERE id = $1 
        AND user_id = $2 
        AND snapshot_id = $3 
        AND active = TRUE
      RETURNING *;
    `;

    const values = [liabilityId, userId, snapshotId, value]; 

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
      UPDATE snapshot_liability
      SET active = FALSE, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *; 
    `;
    
    const values = [liabilityId, userId];
    
    const result = await this.pgPool.query(sql, values);
    return result.rows.length > 0 ? (result.rows[0] as SnapshotLiabilityDto) : null;
  }
}
