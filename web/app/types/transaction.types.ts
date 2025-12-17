export interface TransactionData {
  id: string;           // Added ID for API calls on update
  type: 'income' | 'expense' | ''
  transaction_date: string
  category: string;
  vendor: string;
  amount: string;
  note: string;
}

export type TransactionField = 'date' | 'category' | 'vendor' | 'amount';
