export type TransactionType = 'expense' | 'income';

export type ExpenseCategory = 
  | '大学'
  | '食費' 
  | '日用品' 
  | '交通費' 
  | '趣味・娯楽' 
  | '水道・光熱費' 
  | '通信費' 
  | '住居費' 
  | '医療・健康' 
  | '衣服・美容' 
  | 'その他';

export type IncomeCategory = 
  | 'バイト代'
  | '給与' 
  | '臨時収入' 
  | 'お小遣い' 
  | '事業所得' 
  | 'その他';

export type PaymentMethod = 
  | '現金' 
  | 'クレジットカード' 
  | '電子マネー/QR' 
  | '銀行口座' 
  | 'その他';

export type HolidayRule = 'next_business_day' | 'prev_business_day' | 'none';

export interface CreditCard {
  id: string;
  name: string;
  closing_day: number; // 0: 月末, 1~30: 日付
  payment_month_offset: number; // 0: 当月, 1: 翌月, 2: 翌々月
  payment_day: number; // 1~31 (0: 月末)
  holiday_rule: HolidayRule;
  color: string;
  created_at?: string;
}

export interface CardTemplate {
  name: string;
  company: string;
  closing_day: number;
  payment_month_offset: number;
  payment_day: number;
  holiday_rule: HolidayRule;
  color: string;
  description: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD (利用日)
  type: TransactionType;
  category: string;
  amount: number;
  payment_method: PaymentMethod;
  credit_card_id?: string | null;
  billing_date?: string | null; // YYYY-MM-DD (引き落とし日)
  memo: string;
  created_at: string;
}

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at'>;
