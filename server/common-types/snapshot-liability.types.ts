export interface SnapshotLiabilityDto {
  id: string
  user_id?: string,
  snapshot_id: string       // Foreign Key reference
  category_id: string;      // UUID of the Category Group
  entity_type: 'liability'; // Constant
  
  amount?: number
  party?: string | 'lender' | 'borrower' | 'creditor' | 'debtor' | 'vendor'   // transaction vendor equivalent
  title?: string           // e.g. party may be Vanguard - but title would be 'Roth IRA' or 'Brokerage', etc
  note?: string
  sort_order: number;      // For UI Drag & Drop
  active?: boolean         // instead of delete record
  
  // Liability Specific
  liability_type?: 'short' | 'long'     // long term vs short term maturity
  liability_maturity_date?: Date
  liability_interest_rate?: number
  liability_total_loan_value?: number

  created_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
  updated_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
}

export interface CreateSnapshotLiabilityDto {
  snapshot_id: string; // ONLY required field
}

// The internal service DTO MUST include user_id and category
export interface ServiceCreateSnapshotLiabilityDto extends CreateSnapshotLiabilityDto {
  user_id: string; // From JWT
}

export interface UpdateSnapshotLiabilityFieldDto {
  snapshot_id: string; // Header ID for security check
  // Omit list is based on the database schema fields, INCLUDING user_id (which is not updatable)
  field: keyof Omit<SnapshotLiabilityDto, 
      'id' | 'snapshot_id' | 'created_at' | 'updated_at' | 'category'
  > | 'user_id'; // NOTE: user_id is in the DB, so we must omit it from updatable fields list if it's there.
  value: any; 
}