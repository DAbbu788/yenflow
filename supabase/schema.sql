-- ================================================================
-- YenFlow — Supabase Schema
-- Paste & run this entire file in: Supabase → SQL Editor → New query
-- ================================================================

create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  created_at    timestamptz default now()
);
alter table profiles enable row level security;
create policy "Own profile" on profiles for all using (auth.uid() = id);

-- ── Categories ───────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  color       text default '#F0B429',
  sort_order  int  default 0,
  created_at  timestamptz default now(),
  unique(user_id, name)
);
alter table categories enable row level security;
create policy "Own categories" on categories for all using (auth.uid() = user_id);

-- ── Budget Defaults ──────────────────────────────────────────
create table if not exists budget_defaults (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  category_name  text not null,
  monthly_amount numeric default 0,
  updated_at     timestamptz default now(),
  unique(user_id, category_name)
);
alter table budget_defaults enable row level security;
create policy "Own budget defaults" on budget_defaults for all using (auth.uid() = user_id);

-- ── Monthly Budget Grid ──────────────────────────────────────
create table if not exists monthly_budget_grid (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  category_name  text not null,
  year           int  not null,
  month          int  not null check (month between 1 and 12),
  amount         numeric default 0,
  updated_at     timestamptz default now(),
  unique(user_id, category_name, year, month)
);
alter table monthly_budget_grid enable row level security;
create policy "Own budget grid" on monthly_budget_grid for all using (auth.uid() = user_id);

-- ── Expenses ─────────────────────────────────────────────────
create table if not exists expenses (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  date           date not null,
  description    text,
  category_name  text not null,
  amount         numeric not null check (amount >= 0),
  payment_method text,
  notes          text,
  created_at     timestamptz default now()
);
alter table expenses enable row level security;
create policy "Own expenses" on expenses for all using (auth.uid() = user_id);
create index if not exists expenses_user_date     on expenses(user_id, date);
create index if not exists expenses_user_category on expenses(user_id, category_name);

-- ── Income ───────────────────────────────────────────────────
create table if not exists income (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  year       int  not null,
  month      int  not null check (month between 1 and 12),
  source     text not null,
  amount     numeric not null check (amount >= 0),
  notes      text,
  created_at timestamptz default now()
);
alter table income enable row level security;
create policy "Own income" on income for all using (auth.uid() = user_id);
create index if not exists income_user_year on income(user_id, year);

-- ── Remittance ───────────────────────────────────────────────
create table if not exists remittance (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  date             date not null,
  year             int  not null,
  month            int  not null check (month between 1 and 12),
  amount_jpy       numeric not null check (amount_jpy >= 0),
  exchange_rate    numeric not null check (exchange_rate > 0),
  amount_inr       numeric generated always as (amount_jpy * exchange_rate) stored,
  transfer_service text,
  notes            text,
  created_at       timestamptz default now()
);
alter table remittance enable row level security;
create policy "Own remittance" on remittance for all using (auth.uid() = user_id);

-- ── Phase 2: Friendships ──────────────────────────────────────
create table if not exists friendships (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  friend_id  uuid references auth.users(id) on delete cascade not null,
  status     text default 'pending' check (status in ('pending','accepted','blocked')),
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);
alter table friendships enable row level security;
create policy "Own friendships" on friendships for all
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- ── Phase 2: Group Expenses ───────────────────────────────────
create table if not exists group_expenses (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid references auth.users(id) on delete cascade not null,
  description  text not null,
  total_amount numeric not null check (total_amount >= 0),
  date         date not null,
  split_type   text default 'equal' check (split_type in ('equal','custom','percentage')),
  settled      boolean default false,
  created_at   timestamptz default now()
);
alter table group_expenses enable row level security;
create policy "Group expense visibility" on group_expenses for select
  using (auth.uid() = created_by or exists (
    select 1 from group_splits
    where group_splits.group_expense_id = group_expenses.id
      and group_splits.user_id = auth.uid()
  ));
create policy "Create group expenses"        on group_expenses for insert with check (auth.uid() = created_by);
create policy "Update own group expenses"    on group_expenses for update using (auth.uid() = created_by);

-- ── Phase 2: Group Splits ─────────────────────────────────────
create table if not exists group_splits (
  id               uuid primary key default uuid_generate_v4(),
  group_expense_id uuid references group_expenses(id) on delete cascade not null,
  user_id          uuid references auth.users(id) on delete cascade not null,
  share_amount     numeric not null check (share_amount >= 0),
  settled          boolean default false,
  settled_at       timestamptz,
  unique(group_expense_id, user_id)
);
alter table group_splits enable row level security;
create policy "Own splits" on group_splits for all using (auth.uid() = user_id);

-- ── Phase 2: Peer Transactions (borrow / payback) ────────────
create table if not exists peer_transactions (
  id          uuid primary key default uuid_generate_v4(),
  from_user   uuid references auth.users(id) on delete cascade not null,
  to_user     uuid references auth.users(id) on delete cascade not null,
  amount      numeric not null check (amount >= 0),
  currency    text default 'JPY',
  type        text check (type in ('borrow','payback','gift')),
  description text,
  date        date not null,
  settled     boolean default false,
  created_at  timestamptz default now()
);
alter table peer_transactions enable row level security;
create policy "Own peer transactions" on peer_transactions for all
  using (auth.uid() = from_user or auth.uid() = to_user);

-- ── Trigger: seed categories + defaults on signup ─────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  cats text[]    := array['Groceries','Dining Out','Coffee & Office Snacks','Housing & Rent','Transport','Entertainment','Health & Fitness','Suits & Clothing','Shopping','Utilities','Travel','Loan / EMI','Education','Personal Care','Subscriptions','Gifts & Donations','Insurance','Savings & Investment','Remittance (Home)','Miscellaneous'];
  amts numeric[] := array[30000,25000,8000,90000,15000,20000,10000,15000,20000,15000,30000,30000,15000,8000,5000,5000,10000,20000,30000,10000];
  i int := 1;
begin
  insert into profiles(id, display_name) values (new.id, split_part(new.email,'@',1));
  while i <= array_length(cats,1) loop
    insert into categories(user_id, name, sort_order) values (new.id, cats[i], i) on conflict do nothing;
    insert into budget_defaults(user_id, category_name, monthly_amount) values (new.id, cats[i], amts[i]) on conflict do nothing;
    i := i + 1;
  end loop;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
