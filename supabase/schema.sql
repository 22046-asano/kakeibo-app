-- ========================================================
-- スマート家計簿 PWA 統合スキーマ（新機能対応版）
-- ========================================================

-- 1. クレジットカード管理テーブル
create table if not exists public.credit_cards (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    closing_day integer not null default 0,
    payment_month_offset integer not null default 1,
    payment_day integer not null default 27,
    holiday_rule text not null default 'next_business_day',
    color text default '#2563eb',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. バイト先管理テーブル
create table if not exists public.employers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    hourly_wage integer,
    payday_memo text default '',
    color text default '#2563eb',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 家計簿トランザクションテーブル
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    date date not null default current_date,
    type text not null check (type in ('expense', 'income')),
    category text not null,
    amount integer not null check (amount > 0),
    payment_method text not null default '現金',
    credit_card_id uuid references public.credit_cards(id) on delete set null,
    billing_date date,
    employer_id uuid references public.employers(id) on delete set null,
    employer_name text,
    memo text default '',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 既存テーブルへのカラム追加（マイグレーション用）
alter table public.transactions add column if not exists credit_card_id uuid references public.credit_cards(id) on delete set null;
alter table public.transactions add column if not exists billing_date date;
alter table public.transactions add column if not exists employer_id uuid references public.employers(id) on delete set null;
alter table public.transactions add column if not exists employer_name text;

-- 4. 振込予定管理テーブル (実際の家計簿収支とは独立)
create table if not exists public.expected_incomes (
    id uuid primary key default gen_random_uuid(),
    employer_id uuid references public.employers(id) on delete set null,
    employer_name text not null,
    expected_amount integer not null check (expected_amount > 0),
    expected_pay_date date not null,
    work_period text default '',
    memo text default '',
    is_confirmed boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. 立替金管理テーブル (友達・大学・会社・彼女・家族)
create table if not exists public.reimbursements (
    id uuid primary key default gen_random_uuid(),
    target text not null check (target in ('友達', '大学', '会社', '彼女', '家族')),
    person_or_purpose text not null,
    amount integer not null check (amount > 0),
    date date not null default current_date,
    due_date date,
    is_settled boolean not null default false,
    memo text default '',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. インデックスの作成
create index if not exists idx_transactions_date on public.transactions(date desc);
create index if not exists idx_transactions_billing_date on public.transactions(billing_date desc);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_transactions_category on public.transactions(category);
create index if not exists idx_expected_incomes_date on public.expected_incomes(expected_pay_date desc);
create index if not exists idx_reimbursements_date on public.reimbursements(date desc);

-- 7. 行レベルセキュリティ（RLS）の有効化
alter table public.credit_cards enable row level security;
alter table public.employers enable row level security;
alter table public.transactions enable row level security;
alter table public.expected_incomes enable row level security;
alter table public.reimbursements enable row level security;

-- 開発・個人用ポリシー設定（全操作を許可）
create policy "Allow all on credit_cards" on public.credit_cards for all using (true) with check (true);
create policy "Allow all on employers" on public.employers for all using (true) with check (true);
create policy "Allow all on transactions" on public.transactions for all using (true) with check (true);
create policy "Allow all on expected_incomes" on public.expected_incomes for all using (true) with check (true);
create policy "Allow all on reimbursements" on public.reimbursements for all using (true) with check (true);

-- 8. リアルタイム同期の有効化
alter publication supabase_realtime add table public.credit_cards;
alter publication supabase_realtime add table public.employers;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.expected_incomes;
alter publication supabase_realtime add table public.reimbursements;
