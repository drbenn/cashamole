export interface TransactionDto {
    id: string
    user_id?: string
    category_id?: string
    transaction_date: string
    type: 'income' | 'expense'
    amount?: number
    vendor?: string
    note?: string
    active?: boolean          // instead of delete record
    created_at?: string       // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
    updated_at?: string       // utilize new Date().toIsoString() to keep exact time from client instead of relying on slightly different times due to web/desktop latency
}

export interface ServiceTransactionDto extends TransactionDto {
  user_id: string
}

export interface DeactivateTransactionDto {
  transaction_id: string
  updated_at: string
  active?: boolean
}

export interface UpdateTransactionFieldDto {
  transaction_id: string
  field: string
  new_value: any
  updated_at: string
}