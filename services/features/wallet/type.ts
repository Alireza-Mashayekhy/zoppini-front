// services/features/wallet/type.ts

export interface WalletInfo {
  walletId: number;
  balance: number;
  totalCharged: number;
  totalSpent: number;
  totalRefunded: number;
  createdAt: string;
}

export const WALLET_TRANSACTION_TYPES = [
  'charge',
  'purchase',
  'refund',
  'reversal',
  'adjustment',
] as const;

export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number];

export type WalletTransactionDirection = 'credit' | 'debit';

export const walletTransactionTypeLabels: Record<
  WalletTransactionType,
  string
> = {
  charge: 'شارژ',
  purchase: 'خرید',
  refund: 'عودت',
  reversal: 'برگشت',
  adjustment: 'تصحیح',
};

export interface WalletTransaction {
  id: number;
  transactionKey: string;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  /** مبلغ به‌صورت رشته (مثلاً "2000000.00") */
  amount: string;
  /** مانده کیف پول بعد از تراکنش به‌صورت رشته */
  balanceAfter: string;
  description: string;
  meta?: Record<string, unknown> | null;
  status: string;
  createdAt: string;
}

export interface WalletTransactionsQuery {
  page?: number;
  limit?: number;
  type?: WalletTransactionType | '';
}
