export interface SnapshotAssetDto {
  id: string
  user_id?: string,
  snapshot_id: string       // Foreign Key reference
  category_id: string;      // Changed from 'category: string'
  entity_type: 'asset';     // Hardcoded type identifier
  amount?: number
  party?: string | 'lender' | 'borrower' | 'creditor' | 'debtor' | 'vendor'   // transaction vendor equivalent
  title?: string                    // e.g. party may be Vanguard - but title would be 'Roth IRA' or 'Brokerage', etc
  note?: string
  sort_order: number;
  active?: boolean                  // instead of delete record
  
  // Asset Specific
  asset_valuation?: 'book' | 'market'

  created_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
  updated_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
}


export interface CreateSnapshotAssetDto {
    snapshot_id: string;
}

export interface ServiceCreateSnapshotAssetDto extends CreateSnapshotAssetDto {
    user_id: string; // Verified from JWT
}

export interface UpdateSnapshotAssetFieldDto {
  snapshot_id: string; // Header ID for security check
  // Restricts updatable fields to all fields EXCEPT the critical system/linkage ones
  field: keyof Omit<SnapshotAssetDto, 
      'id' | 'snapshot_id' | 'user_id' | 'created_at' | 'updated_at' | 'category_id'
  >; 
  value: any; 
}