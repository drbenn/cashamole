import { CreateSnapshotHeaderApiDto, CreateSnapshotHeaderDto, SnapshotAssetDto, SnapshotDetailDto, SnapshotHeaderDto, SnapshotLiabilityDto } from '@common-types';
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
  async findHeaderByDateAndUser(user_id: string, snapshot_date: Date): Promise<SnapshotHeaderDto | null> {
    console.log('f sd: ', snapshot_date);

    const dateString = snapshot_date.toISOString().split('T')[0];
    
    const sql = `
      SELECT id, user_id, snapshot_date, created_at, active
      FROM snapshot_headers
      WHERE user_id = $1 AND snapshot_date = $2;
    `;
    
    try {
      const result = await this.pgPool.query(sql, [user_id, dateString]);
      
      if (result.rows.length > 0) {
        this.logger.warn(
          `Existing snapshot found for user ${user_id} on date ${dateString}`, 
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

  async findSnapshotDetailById(snapshotId: string, userId: string): Promise<SnapshotDetailDto | null> {
    // 1. Get the Header and verify user ownership (Same as before)
    const headerSql = `
      SELECT id, user_id, snapshot_date, created_at, active
      FROM snapshot_header
      WHERE id = $1 AND user_id = $2;
    `;
    const headerResult = await this.pgPool.query(headerSql, [snapshotId, userId]);
    
    if (headerResult.rows.length === 0) {
      return null;
    }
    const header = headerResult.rows[0];
    
    // 2. Get the Assets/Details
    const assetsSql = `
      SELECT id, asset_name, current_value, quantity, asset_type 
      FROM snapshot_asset 
      WHERE snapshot_header_id = $1;
    `;
    const assetsResult = await this.pgPool.query(assetsSql, [snapshotId]);
    const assets = assetsResult.rows as SnapshotAssetDto[];

    // 3. Get the Liabilities/Details (NEW QUERY)
    const liabilitiesSql = `
      SELECT id, liability_name, current_debt, type 
      FROM snapshot_liability 
      WHERE snapshot_header_id = $1;
    `;
    const liabilitiesResult = await this.pgPool.query(liabilitiesSql, [snapshotId]);
    const liabilities = liabilitiesResult.rows as SnapshotLiabilityDto[];

    // 4. Calculate Totals (NEW LOGIC)
    
    // Sum of all asset current_value (use reduce to sum the number field)
    const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.amount || 0), 0);
    
    // Sum of all liability current_debt (use reduce to sum the number field)
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + Number(liability.amount || 0), 0);
    
    // Calculate Net Worth
    const netWorth = totalAssets - totalLiabilities;


    // 5. Assemble the full object
    const snapshotDetail: SnapshotDetailDto = {
        id: header.id,
        user_id: header.user_id,
        // Convert the date artifact back to a clean string
        snapshot_date: header.snapshot_date.toISOString().split('T')[0], 
        created_at: header.created_at,
        
        assets: assets,
        liabilities: liabilities, // NEW
        
        // NEW AGGREGATE FIELDS
        total_assets: totalAssets, 
        total_liabilities: totalLiabilities,
        net_worth: netWorth,
    };

    return snapshotDetail;
  }

  /**
   * Marks a snapshot header as inactive (soft delete).
   * Requires both the snapshot ID and the user ID for ownership check.
   */
  async deactivateHeader(snapshotId: string, userId: string): Promise<SnapshotHeaderDto | null> {
    const sql = `
      UPDATE snapshot_headers
      SET active = FALSE, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id, snapshot_date, created_at, active; 
    `;
    
    try {
      const result = await this.pgPool.query(sql, [snapshotId, userId]);
      
      return result.rows.length > 0 ? (result.rows[0] as SnapshotHeaderDto) : null;
    } catch (error) {
      this.logger.error(`DB Error deactivating snapshot ID ${snapshotId}: ${error.message}`, SnapshotQueryService.name);
      throw new Error('Database error during header deactivation.');
    }
  }

  /**
   * Updates the snapshot_date for an existing header.
   * This should only be called AFTER the uniqueness check in the service layer.
   */
  async updateHeaderDate(snapshotId: string, userId: string, newDateString: string): Promise<SnapshotHeaderDto | null> {
    const sql = `
      UPDATE snapshot_headers
      SET snapshot_date = $3, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, snapshot_date, created_at, active;
    `;
    
    try {
      const result = await this.pgPool.query(sql, [snapshotId, userId, newDateString]);
      
      return result.rows.length > 0 ? (result.rows[0] as SnapshotHeaderDto) : null;
    } catch (error) {
      this.logger.error(`DB Error updating date for snapshot ID ${snapshotId}: ${error.message}`, SnapshotQueryService.name);
      // Let the service layer handle the Conflict/Uniqueness exception if PostgreSQL throws one
      throw error; 
    }
  }


  async getFullDashboardSummary(userId: string): Promise<any[]> {
    const sql = `
      WITH latest_snapshot AS (
          -- Find the ID of the most recent active snapshot for this user
          SELECT id 
          FROM snapshot_headers 
          WHERE user_id = $1 AND active = TRUE 
          ORDER BY snapshot_date DESC 
          LIMIT 1
      )
      SELECT 
          c.id AS category_id,
          c.name AS category_name,
          c.usage_type, -- 'transaction', 'asset', or 'liability'
          c.icon,
          c.color,
          -- Nest Transactions
          (SELECT COALESCE(jsonb_agg(t_inner ORDER BY t_inner.transaction_date DESC), '[]')
          FROM (
              SELECT id, amount, vendor, transaction_date, note 
              FROM transactions 
              WHERE category_id = c.id AND user_id = $1 AND active = TRUE
          ) t_inner) AS transactions,
          -- Nest Snapshot Assets
          (SELECT COALESCE(jsonb_agg(a_inner ORDER BY a_inner.sort_order ASC), '[]')
          FROM (
              SELECT sa.id, sa.amount, sa.title, sa.party, sa.asset_valuation 
              FROM snapshot_assets sa
              JOIN latest_snapshot ls ON sa.snapshot_id = ls.id
              WHERE sa.category_id = c.id AND sa.user_id = $1 AND sa.active = TRUE
          ) a_inner) AS assets,
          -- Nest Snapshot Liabilities
          (SELECT COALESCE(jsonb_agg(l_inner ORDER BY l_inner.sort_order ASC), '[]')
          FROM (
              SELECT sl.id, sl.amount, sl.title, sl.party, sl.liability_type 
              FROM snapshot_liabilities sl
              JOIN latest_snapshot ls ON sl.snapshot_id = ls.id
              WHERE sl.category_id = c.id AND sl.user_id = $1 AND sl.active = TRUE
          ) l_inner) AS liabilities,
          -- Aggregate Totals per Category
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE category_id = c.id AND active = TRUE) as total_transaction_amount,
          (SELECT COALESCE(SUM(amount), 0) FROM snapshot_assets sa JOIN latest_snapshot ls ON sa.snapshot_id = ls.id WHERE sa.category_id = c.id AND sa.active = TRUE) as total_asset_amount,
          (SELECT COALESCE(SUM(amount), 0) FROM snapshot_liabilities sl JOIN latest_snapshot ls ON sl.snapshot_id = ls.id WHERE sl.category_id = c.id AND sl.active = TRUE) as total_liability_amount
      FROM categories c
      WHERE c.user_id = $1
      ORDER BY c.usage_type, c.name;
    `
    
    try {
        const result = await this.pgPool.query(sql, [userId]);
        return result.rows; 
    } catch (error) {
        this.logger.error(`Monster Query Failed: ${error.message}`);
        throw new Error('Database failed to generate dashboard summary.');
    }
  }
}