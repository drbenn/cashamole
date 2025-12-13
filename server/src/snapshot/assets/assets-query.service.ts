import { ServiceCreateSnapshotAssetDto, SnapshotAssetDto } from '@common-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Pool } from 'pg';
import { PG_CONNECTION } from 'src/database/database.constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SnapshotAssetQueryService {
  // Inject the singleton Pool instance
  constructor(
    @Inject(PG_CONNECTION) private pgPool: Pool,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // =================================================================
  // CREATE (MINIMAL FIELDS)
  // =================================================================
  async createAsset(dto: ServiceCreateSnapshotAssetDto): Promise<SnapshotAssetDto> {
    const sql = `
      INSERT INTO snapshot_asset 
        (id, snapshot_id, user_id, category, active)
      VALUES ($1, $2, $3, 'asset', TRUE)
      RETURNING *;
    `;

    const id = uuidv4()
    const values = [id, dto.snapshot_id, dto.user_id];
    
    const result = await this.pgPool.query(sql, values);
    return result.rows[0] as SnapshotAssetDto;
  }

  // =================================================================
  // UPDATE (PRECISE FIELD-LEVEL UPDATE)
  // =================================================================
  async updateAsset(
    assetId: string, 
    userId: string, 
    snapshotId: string, 
    field: string, 
    value: any
  ): Promise<SnapshotAssetDto | null> {
    
    // NOTE: Assume 'snapshot_asset' is the table name
    const sql = `
      UPDATE snapshot_asset
      SET 
        "${field}" = $4,
        updated_at = NOW()
      WHERE id = $1 
        AND user_id = $2 
        AND snapshot_id = $3 
        AND active = TRUE
      RETURNING *;
    `;
      
    const values = [assetId, userId, snapshotId, value]; 

    const result = await this.pgPool.query(sql, values);
    return result.rows.length > 0 ? (result.rows[0] as SnapshotAssetDto) : null;
  }

  // =================================================================
  // DEACTIVATE
  // =================================================================
  async deactivateAsset(assetId: string, userId: string): Promise<SnapshotAssetDto | null> {
    const sql = `
      UPDATE snapshot_asset
      SET active = FALSE, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *; 
    `;
    
    const result = await this.pgPool.query(sql, [assetId, userId]);
    return result.rows.length > 0 ? (result.rows[0] as SnapshotAssetDto) : null;
  }
}
