-- ========================================================
-- スマート家計簿 PWA v6 セキュリティ強化版スキーマ（RLS完全ロック対応）
-- ========================================================

-- 1. 既存テーブルへの user_id カラム追加（所有者IDの紐付け）
alter table public.credit_cards add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.employers add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.transactions add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.expected_incomes add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.reimbursements add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- 2. ログイン前に作成された既存データを初回ログイン時に自分のアカウントへ引き継ぐ関数
create or replace function public.claim_unowned_records()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.credit_cards set user_id = auth.uid() where user_id is null;
  update public.employers set user_id = auth.uid() where user_id is null;
  update public.transactions set user_id = auth.uid() where user_id is null;
  update public.expected_incomes set user_id = auth.uid() where user_id is null;
  update public.reimbursements set user_id = auth.uid() where user_id is null;
end;
$$;

-- 3. 行レベルセキュリティ（RLS）の有効化
alter table public.credit_cards enable row level security;
alter table public.employers enable row level security;
alter table public.transactions enable row level security;
alter table public.expected_incomes enable row level security;
alter table public.reimbursements enable row level security;

-- 4. 従来の開発用オープンポリシー（未ログイン許可）をすべて削除
drop policy if exists "Allow full access for anon" on public.transactions;
drop policy if exists "Allow full access for transactions anon" on public.transactions;
drop policy if exists "Allow full access for credit_cards anon" on public.credit_cards;
drop policy if exists "Allow all on credit_cards" on public.credit_cards;
drop policy if exists "Allow all on employers" on public.employers;
drop policy if exists "Allow all on transactions" on public.transactions;
drop policy if exists "Allow all on expected_incomes" on public.expected_incomes;
drop policy if exists "Allow all on reimbursements" on public.reimbursements;

-- 再実行時のために既存のOwnerポリシーも一旦削除
drop policy if exists "Owner only on credit_cards" on public.credit_cards;
drop policy if exists "Owner only on employers" on public.employers;
drop policy if exists "Owner only on transactions" on public.transactions;
drop policy if exists "Owner only on expected_incomes" on public.expected_incomes;
drop policy if exists "Owner only on reimbursements" on public.reimbursements;

-- 5. 本人限定ポリシーの作成（ログイン済みの本人データのみ読み書き許可・未ログイン通信は100%遮断）
create policy "Owner only on credit_cards"
on public.credit_cards for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Owner only on employers"
on public.employers for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Owner only on transactions"
on public.transactions for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Owner only on expected_incomes"
on public.expected_incomes for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Owner only on reimbursements"
on public.reimbursements for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
