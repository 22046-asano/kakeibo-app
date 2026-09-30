# スマート家計簿 PWA (Smart Kakeibo PWA)

PCとスマートフォンの両方で利用でき、どちらから更新してもリアルタイムに連動するクラウド家計簿Webアプリケーション（PWA対応）です。

---

## 🌟 今回のアップデート・仕様変更内容

1. **支出・収入カテゴリの適正化**:
   - 支出カテゴリに **「クレカ」** を追加。
   - 「大学」「バイト代」の不要な絵文字アイコンを削除し、すっきりとしたUIに統一。
   - 収入カテゴリから「給与」を削除（「バイト代」に一本化）。
   - 収入の受取方法は **「銀行口座振込」** のみに固定。
2. **バイト先の複数管理 ＆ 年間合算扶養計算**:
   - 複数のバイト先（塾、カフェ、大学TAなど）を登録・管理（名称、時給、給料日メモ）。
   - 収入登録時にバイト先を選択でき、年間タブでバイト先別の年間累計と合算年収を把握可能。
3. **最新の税制改正（2025〜2026年）対応の年収シミュレーション**:
   - 所得税の壁引き上げに対応（**178万円・160万円・150万円・130万円・103万円・カスタム**から基準ラインをワンタップ選択）。
   - 複数バイト先の合算バイト代に対する進捗率（％）と、**「基準まであといくら稼げるか」**の残り可能額をリアルタイム表示。
4. **振込予定 ＆ 5大立替金管理タブの新設（実際の収支とは完全独立）**:
   - **バイト代振込予定チェック**: 給与明細と実際の銀行口座振込額が合っているかを照合。「振込を確認」ボタンで実際の家計簿収入へワンタップ自動登録も可能。
   - **立替金管理**: **「友達」「大学」「会社」「彼女」「家族」**の5区分で立て替えたお金を管理。未回収合計額の表示と精算完了管理で請求漏れを防止。
5. **月別収支 ＆ カレンダーの統合ダッシュボード**:
   - タブを切り替える必要なく、1画面内で **「📋 明細リスト」と「📅 カレンダー」をワンタップでシームレスに切り替え可能**。
   - カレンダー上には日別収支に加え、クレジットカード引き落とし予定日（支払日）が青いバッジで表示。
6. **クレジットカードの登録後「編集（Edit）」機能**:
   - 登録したクレジットカードを削除することなく、締め日・支払日・祝日振替ルール・カード名をいつでも自由に編集可能。

---

## 🛠 データベースの更新手順（Supabase）

新機能（バイト先テーブル、振込予定テーブル、立替金テーブルなど）を有効化するため、以下のSQLを Supabase の **SQL Editor** で貼り付けて実行（Run）してください：

```sql
-- 1. バイト先管理テーブル
create table if not exists public.employers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    hourly_wage integer,
    payday_memo text default '',
    color text default '#2563eb',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. トランザクションテーブルへのカラム追加
alter table public.transactions add column if not exists employer_id uuid references public.employers(id) on delete set null;
alter table public.transactions add column if not exists employer_name text;

-- 3. 振込予定管理テーブル (実際の家計簿収支とは独立)
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

-- 4. 立替金管理テーブル (友達・大学・会社・彼女・家族)
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

-- 5. RLSとリアルタイム有効化
alter table public.employers enable row level security;
alter table public.expected_incomes enable row level security;
alter table public.reimbursements enable row level security;

create policy "Allow all on employers" on public.employers for all using (true) with check (true);
create policy "Allow all on expected_incomes" on public.expected_incomes for all using (true) with check (true);
create policy "Allow all on reimbursements" on public.reimbursements for all using (true) with check (true);

alter publication supabase_realtime add table public.employers;
alter publication supabase_realtime add table public.expected_incomes;
alter publication supabase_realtime add table public.reimbursements;
```

---

## 🚀 反映手順（GitHub へのプッシュ）

1. 提供した Zip ファイルを展開し、既存のプロジェクトフォルダに上書きします。
2. コマンドプロンプトで以下のコマンドを実行します：
   ```cmd
   git add .
   git commit -m "Update: comprehensive feature overhaul"
   git push
   ```
3. Vercel が自動でビルドし、約1分後に最新版が公開されます。
