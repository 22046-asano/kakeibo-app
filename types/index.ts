export type TransactionType = 'expense' | 'income';

export type ExpenseCategory = 
  | '大学'
  | 'クレカ'
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
  | '臨時収入' 
  | 'お小遣い' 
  | '事業所得' 
  | 'その他';

export type PaymentMethod = 
  | 'クレジットカード'
  | '現金' 
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

// バイト先マスタ
export interface Employer {
  id: string;
  name: string;
  hourly_wage?: number | null;
  payday_memo?: string; // 例: 毎月25日振込
  color?: string;
  created_at?: string;
}

// 振込予定管理 (家計簿収支とは独立)
export interface ExpectedIncome {
  id: string;
  employer_id?: string | null;
  employer_name: string;
  expected_amount: number;
  expected_pay_date: string; // YYYY-MM-DD
  work_period?: string; // 例: 9月前半 (20h)
  memo?: string;
  is_confirmed: boolean; // 振込確認済みか
  created_at?: string;
}

// 立替金管理 (5大立替: 友達・大学・会社・彼女・家族)
export type ReimbursementTarget = '友達' | '大学' | '会社' | '彼女' | '家族';

export interface Reimbursement {
  id: string;
  target: ReimbursementTarget;
  person_or_purpose: string; // 相手の名前や用途
  amount: number;
  date: string; // 立替日 YYYY-MM-DD
  due_date?: string; // 回収・精算予定日
  is_settled: boolean; // 精算済みか
  memo?: string;
  created_at?: string;
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
  employer_id?: string | null;
  employer_name?: string | null;
  memo: string;
  created_at: string;
}

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at'>;
