import { DeactivateSnapshotDto, FetchSnapshotsDto, SnapshotDto, UpdateSnapshotFieldDto } from '@common-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Pool } from 'pg';
import { PG_CONNECTION } from 'src/database/database.constants';

@Injectable()
export class SnapshotQueryService {
  // Inject the singleton Pool instance
  constructor(
    @Inject(PG_CONNECTION) private pgPool: Pool,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async insertSnapshot(dto: SnapshotDto): Promise<SnapshotDto> {
    const queryText = `
      INSERT INTO "snapshots" (id, user_id, snapshot_date, category, created_at, updated_at, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      dto.id,
      dto.user_id,
      dto.snapshot_date,
      dto.category,
      dto.created_at,
      dto.updated_at,
      true
    ];

    try {
      const result = await this.pgPool.query(queryText, values);   
      const snapshot: SnapshotDto = result.rows[0]
      return snapshot
    } catch (error) {
      this.logger.log('warn', `Error: snapshot-query-service insertSnapshot: ${error}`);
      throw new Error('Error: snapshot-query-service insertSnapshot');
    }
  }

  async getAllUserSnapshots(dto: FetchSnapshotsDto): Promise<SnapshotDto[]> {
    const queryText = `
      SELECT * FROM snapshots
      WHERE user_id = $1 AND status = $2;
    `;

    const values = [
      dto.user_id,
      true
    ];

    try {
      const result = await this.pgPool.query(queryText, values);   
      const snapshots: SnapshotDto[] = result.rows[0]
      return snapshots
    } catch (error) {
      this.logger.log('warn', `Error: snapshot-query-service getAllUsersSnapshots: ${error}`);
      throw new Error('Error: snapshot-query-service getAllUsersSnapshots');
    }
  }

  async updateSnapshotField(dto: UpdateSnapshotFieldDto): Promise<UpdateSnapshotFieldDto> {
    const queryText = `
      UPDATE "snapshots" 
      SET ${dto.field} = $1, updated_at = $2
      WHERE user_id = $3 AND id = $4 RETURNING *;`  

    const values = [
      dto.new_value,
      dto.updated_at,
      dto.user_id,
      dto.snapshot_id,
    ];

    try {
      const result = await this.pgPool.query(queryText, values);   
      const snapshot: SnapshotDto = result.rows[0]
      const updatedSnapshot: UpdateSnapshotFieldDto = {
        user_id: snapshot.user_id,
        snapshot_id: snapshot.id,
        field: dto.field,
        new_value: dto.new_value,
        updated_at: snapshot.updated_at!
      }
      return updatedSnapshot
    } catch (error) {
      this.logger.log('warn', `Error: snapshot-query-service updateSnapshotField: ${error}`);
      throw new Error('Error: snapshot-query-service updateSnapshotField');
    }
  }

  async deactivateSnapshot(dto: DeactivateSnapshotDto): Promise<DeactivateSnapshotDto> {
    const queryText = `
      UPDATE "snapshots" 
      SET active = $1, updated_at = $2
      WHERE user_id = $2 AND id = $3 RETURNING *;`  

    const values = [
      false,
      dto.updated_at,
      dto.user_id,
      dto.snapshot_id,
    ];

    try {
      const result = await this.pgPool.query(queryText, values);   
      const snapshot: SnapshotDto = result.rows[0]
      const deactivatedSnapshot: DeactivateSnapshotDto = {
        user_id: snapshot.user_id,
        snapshot_id: snapshot.id,
        active: snapshot.active,
        updated_at: snapshot.updated_at!
      }
      return deactivatedSnapshot
    } catch (error) {
      this.logger.log('warn', `Error: snapshot-query-service deactivateSnapshot: ${error}`);
      throw new Error('Error: snapshot-query-service deactivateSnapshot');
    }
  }
}
