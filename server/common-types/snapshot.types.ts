export interface SnapshotHeaderDto {
  id: string
  user_id: string
  snapshot_date: Date
  items: (SnapshotAssetDto | SnapshotLiabilityDto)[]
  active?: boolean 
  created_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
  updated_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
}

export interface SnapshotAssetDto {
  id: string
  category: 'asset'
  amount?: number
  party?: string | 'lender' | 'borrower' | 'creditor' | 'debtor' | 'vendor'   // transaction vendor equivalent
  title?: string                    // e.g. party may be Vanguard - but title would be 'Roth IRA' or 'Brokerage', etc
  note?: string
  active?: boolean                  // instead of delete record
  created_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
  updated_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency

  // Asset Specific
  asset_valuation?: 'book' | 'market'
}

export interface SnapshotLiabilityDto {
  id: string
  category: 'liablity'
  amount?: number
  party?: string | 'lender' | 'borrower' | 'creditor' | 'debtor' | 'vendor'   // transaction vendor equivalent
  title?: string                    // e.g. party may be Vanguard - but title would be 'Roth IRA' or 'Brokerage', etc
  note?: string
  active?: boolean                  // instead of delete record
  created_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
  updated_at?: string               // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency

  // Liability Specific
  liability_type?: 'short' | 'long'     // long term vs short term maturity
  liability_maturity_date?: Date
  liability_interest_rate?: number
  liability_total_loan_value?: number
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