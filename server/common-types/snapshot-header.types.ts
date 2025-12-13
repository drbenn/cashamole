import { SnapshotAssetDto } from "./snapshot-asset.types"
import { SnapshotLiabilityDto } from "./snapshot-liability.types"

export interface SnapshotHeaderDto {
  id: string
  user_id: string
  snapshot_date: Date | string      // Date for api to process string of e.g. '2025-12-16' for succinct response
  items: (SnapshotAssetDto | SnapshotLiabilityDto)[]
  total_assets?: number             // Read-only, calculated value
  total_liablities?: number         // Read-only, calculated value
  active?: boolean 
  created_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
  updated_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
}

export interface CreateSnapshotHeaderDto {
  /** The calendar date of the snapshot (e.g., '2025-12-31'). */
  snapshot_date: Date;
}

export interface UpdateSnapshotDateDto {
  /** The calendar date of the snapshot (e.g., '2025-12-31'). */
  snapshot_date: Date;
}

export interface SnapshotDetailDto {
  id: string; // Header ID
  user_id: string;
  snapshot_date: string; // YYYY-MM-DD string
  created_at: Date;
  assets: SnapshotAssetDto[]; // Array of associated assets
  liabilities: SnapshotLiabilityDto[];
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
}

export interface CreateSnapshotHeaderApiDto {
  /** The calendar date of the snapshot (e.g., '2025-12-31'). */
  snapshot_date: Date
  user_id: string              // user_id added internally from jwt-guard to use in sql service 
}

export interface FetchSnapshotsDto {
  user_id: string
}

export interface DeactivateSnapshotDto {
  user_id: string
  snapshot_id: string
  updated_at: string
}

export interface UpdateSnapshotFieldDto {
  user_id: string
  snapshot_id: string
  field: string
  new_value: any
  updated_at: string
}