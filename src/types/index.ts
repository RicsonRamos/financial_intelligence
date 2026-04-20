import { Request } from 'express';

// Express Request Augmentation for multi-tenant context
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: string;
  description: string | null;
  transaction_date: string;
  is_recurrent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  is_essential: boolean;
  created_at: string;
  updated_at: string;
}

export interface BalanceAnalytics {
  transaction_date: string;
  amount: string;
  running_balance: string;
}

export interface ForecastResponse {
  date: string;
  projected_balance: string;
}

export interface CreateTransactionDTO {
  account_id: string;
  category_id?: string;
  amount: number | string;
  description?: string;
  transaction_date?: string;
}

export interface UpdateTransactionDTO {
  category_id?: string;
  amount?: number | string;
  description?: string;
}
