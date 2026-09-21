-- 1. クレジットカード管理テーブルの作成
create table if not exists public.credit_cards (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    closing_day integer not null default 0, -- 0: 月末, 1~30: 指定日
    payment_month_offset integer not null default 1, -- 0: 当月, 1: 翌月, 2: 翌々月
    payment_day integer not null default 27, -- 1~31 (0: 月末)
    holiday_rule text not null default 'next_business_day', -- next_business_day | prev_business_day | none
    color text default '#2563eb',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 家計簿トランザクションテーブルの作成
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    date date not null default current_date,
    type text not null check (type in ('expense', 'income')),
    category text not null,
    amount integer not null check (amount > 0),
    payment_method text not null default '現金',
    credit_card_id uuid references public.credit_cards(id) on delete set null,
    billing_date date, -- カード引き落とし予定日（自動計算）
    memo text default '',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 既存テーブルへのカラム追加（すでにテーブルを作成済みのユーザー用マイグレーション）
alter table public.transactions add column if not exists credit_card_id uuid references public.credit_cards(id) on delete set null;
alter table public.transactions add column if not exists billing_date date;

-- 3. 検索用インデックスの作成
create index if not exists idx_transactions_date on public.transactions(date desc);
create index if not exists idx_transactions_billing_date on public.transactions(billing_date desc);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_transactions_category on public.transactions(category);

-- 4. 行レベルセキュリティ（RLS）の有効化
alter table public.credit_cards enable row level security;
alter table public.transactions enable row level security;

-- ポリシー設定
create policy "Allow full access for credit_cards anon" 
on public.credit_cards for all using (true) with check (true);

create policy "Allow full access for transactions anon" 
on public.transactions for all using (true) with check (true);

-- 5. リアルタイム同期の有効化
alter publication supabase_realtime add table public.credit_cards;
alter publication supabase_realtime add table public.transactions;

-- 6. 初期カードテンプレートの投入例（必要に応じて登録）
insert into public.credit_cards (name, closing_day, payment_month_offset, payment_day, holiday_rule, color)
values 
  ('楽天カード', 0, 1, 27, 'next_business_day', '#dc2626'),
  ('三井住友カード(10日払)', 15, 1, 10, 'next_business_day', '#16a34a')
on conflict do nothing;
