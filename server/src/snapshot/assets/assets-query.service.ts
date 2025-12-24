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
    const methodName = SnapshotAssetQueryService.name + '.createAsset';
      
    // We only provide the IDs. 'amount', 'active', and 'entity_type' 
    // are handled by DB defaults or hardcoded values here.
    const queryText = `
      INSERT INTO snapshot_assets 
        (
          id, 
          snapshot_id, 
          user_id, 
          category_id, 
          sort_order
        )
      VALUES (
        $1, 
        $2, 
        $3, 
        (SELECT id FROM categories WHERE user_id = $3 AND name = 'Uncategorized' AND usage_type = 'asset' LIMIT 1), 
        (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM snapshot_assets WHERE snapshot_id = $2 AND user_id = $3)
      )
      RETURNING *;
    `;

    const id = uuidv4();
    const values = [
      id, 
      dto.snapshot_id, 
      dto.user_id
    ];
    
    try {
      const result = await this.pgPool.query(queryText, values);
      
      this.logger.log(`Created minimal asset row ${id} for snapshot ${dto.snapshot_id}`, methodName);
      return result.rows[0] as SnapshotAssetDto;
    } catch (error) {
      this.logger.error(`Error: ${methodName}: ${error.message}`);
      throw new Error(`Error: ${methodName}`);
    }
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
    
    let sql = ''
    const values = [value, assetId, userId, snapshotId]

    if (field === 'category_id') {
      // Verify the new category belongs to the user and is active
      sql = `
        UPDATE snapshot_assets
        SET category_id = $1, updated_at = NOW()
        WHERE id = $2 
          AND user_id = $3 
          AND snapshot_id = $4
          AND EXISTS (SELECT 1 FROM categories WHERE id = $1 AND user_id = $3)
        RETURNING *;
      `;
    } else {
      sql = `
        UPDATE snapshot_assets
        SET "${field}" = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3 AND snapshot_id = $4 AND active = TRUE
        RETURNING *;
      `;
    }

    try {
      const result = await this.pgPool.query(sql, values);
      return result.rows.length > 0 ? (result.rows[0] as SnapshotAssetDto) : null;
    } catch (error) {
      this.logger.error(`Error: snapshot-asset-query-service updateAsset: ${error}`);
      throw new Error('Error: snapshot-asset-query-service updateAsset');
    }
  }

  // =================================================================
  // DEACTIVATE
  // =================================================================
  async deactivateAsset(assetId: string, userId: string): Promise<SnapshotAssetDto | null> {
    const sql = `
      UPDATE snapshot_assets
      SET active = FALSE, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *; 
    `;
    
    const result = await this.pgPool.query(sql, [assetId, userId]);
    return result.rows.length > 0 ? (result.rows[0] as SnapshotAssetDto) : null;
  }
}
