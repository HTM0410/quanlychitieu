-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing triggers
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists update_budget_spent_trigger on transactions;
drop trigger if exists update_categories_updated_at on categories;
drop trigger if exists update_profiles_updated_at on profiles;
drop trigger if exists update_transactions_updated_at on transactions;
drop trigger if exists update_budgets_updated_at on budgets;
drop trigger if exists update_financial_goals_updated_at on financial_goals;
drop trigger if exists update_debts_updated_at on debts;
drop trigger if exists update_user_preferences_updated_at on user_preferences;

-- Drop existing functions
drop function if exists handle_new_user cascade;
drop function if exists update_budget_spent cascade;
drop function if exists update_debt_status cascade;
drop function if exists update_updated_at_column cascade;

-- Drop existing tables if they exist
drop table if exists budgets cascade;
drop table if exists transactions cascade;
drop table if exists categories cascade;
drop table if exists financial_goals cascade;
drop table if exists debts cascade;
drop table if exists user_preferences cascade;
drop table if exists profiles cascade;

-- Create function to update updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create tables
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS for profiles and categories first
alter table profiles enable row level security;
alter table categories enable row level security;

-- Create policies for profiles
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Create policies for categories
create policy "Cho phép xem danh mục mặc định và danh mục của user" on categories
  for select to authenticated
  using (user_id is null or user_id = auth.uid());

create policy "Cho phép thêm danh mục" on categories
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "Cho phép cập nhật danh mục của user" on categories
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Cho phép xóa danh mục của user" on categories
  for delete to authenticated
  using (user_id = auth.uid());

-- Thêm các danh mục mặc định cho chi tiêu
INSERT INTO categories (id, name, type, color) VALUES
  ('37a85603-d42f-421c-9b73-52d5e5d8d85a', 'Ăn uống', 'expense', 'bg-red-500'),
  ('b3c27ff4-82b2-4e91-8f08-b9aaa54964f0', 'Di chuyển', 'expense', 'bg-red-500'),
  ('c9f6a9d7-1b4c-4e5f-8e3a-2c4b5d6d7e8f', 'Mua sắm', 'expense', 'bg-red-500'),
  ('d8e7f6a5-4b3c-2d1e-9f8a-7b6c5d4e3f2a', 'Hóa đơn & Tiện ích', 'expense', 'bg-red-500'),
  ('e5d4c3b2-a1b2-c3d4-e5f6-a7b8c9d0e1f2', 'Giải trí', 'expense', 'bg-red-500'),
  ('f2e1d0c9-b8a7-6f5e-4d3c-2b1a0f9e8d7c', 'Sức khỏe', 'expense', 'bg-red-500'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Giáo dục', 'expense', 'bg-red-500'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Khác', 'expense', 'bg-red-500');

-- Thêm các danh mục mặc định cho thu nhập
INSERT INTO categories (id, name, type, color) VALUES
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Lương', 'income', 'bg-green-500'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Thưởng', 'income', 'bg-green-500'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Đầu tư', 'income', 'bg-green-500'),
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'Được tặng', 'income', 'bg-green-500'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', 'Thu nhập phụ', 'income', 'bg-green-500'),
  ('b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e', 'Khác', 'income', 'bg-green-500');

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  amount decimal(20,2) not null,
  type text not null check (type in ('income', 'expense')),
  date date not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table budgets (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount decimal not null,
  spent decimal default 0,
  month date not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table financial_goals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  target_amount decimal not null,
  current_amount decimal default 0,
  deadline date,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount decimal not null,
  type text not null check (type in ('borrow', 'lend')),
  person_name text not null,
  description text,
  due_date date,
  status text not null check (status in ('pending', 'paid', 'overdue')) default 'pending',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table user_preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  currency text default 'VND',
  language text default 'vi',
  financial_month_start integer default 1,
  date_format text default 'dd/mm/yyyy',
  notifications jsonb default '{
    "email": true,
    "push": true,
    "weeklyReport": true,
    "budgetAlert": true,
    "tips": false
  }'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security for remaining tables
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table financial_goals enable row level security;
alter table debts enable row level security;
alter table user_preferences enable row level security;

-- Create indexes
create index if not exists transactions_user_id_idx on transactions(user_id);
create index if not exists transactions_category_id_idx on transactions(category_id);
create index if not exists transactions_date_idx on transactions(date);
create index if not exists transactions_type_idx on transactions(type);

create index if not exists budgets_user_id_idx on budgets(user_id);
create index if not exists budgets_category_id_idx on budgets(category_id);
create index if not exists budgets_month_idx on budgets(month);

create index if not exists financial_goals_user_id_idx on financial_goals(user_id);
create index if not exists financial_goals_deadline_idx on financial_goals(deadline);

create index if not exists debts_user_id_idx on debts(user_id);
create index if not exists debts_status_idx on debts(status);
create index if not exists debts_type_idx on debts(type);

-- Create triggers for updated_at columns
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

create trigger update_categories_updated_at
  before update on categories
  for each row
  execute function update_updated_at_column();

create trigger update_transactions_updated_at
  before update on transactions
  for each row
  execute function update_updated_at_column();

create trigger update_budgets_updated_at
  before update on budgets
  for each row
  execute function update_updated_at_column();

create trigger update_financial_goals_updated_at
  before update on financial_goals
  for each row
  execute function update_updated_at_column();

create trigger update_debts_updated_at
  before update on debts
  for each row
  execute function update_updated_at_column();

create trigger update_user_preferences_updated_at
  before update on user_preferences
  for each row
  execute function update_updated_at_column();

-- Create function to handle new user signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);

  insert into user_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

-- Create function to update budget spent
create or replace function update_budget_spent()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update budgets
    set spent = spent + new.amount
    where user_id = new.user_id
      and category_id = new.category_id
      and month = date_trunc('month', new.date);
  elsif (TG_OP = 'UPDATE') then
    update budgets
    set spent = spent - old.amount + new.amount
    where user_id = new.user_id
      and category_id = new.category_id
      and month = date_trunc('month', new.date);
  elsif (TG_OP = 'DELETE') then
    update budgets
    set spent = spent - old.amount
    where user_id = old.user_id
      and category_id = old.category_id
      and month = date_trunc('month', old.date);
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Create function to update debt status
create or replace function update_debt_status()
returns trigger as $$
begin
  update debts
  set status = 'overdue'
  where status = 'pending'
    and due_date < current_date;
  return null;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create trigger update_budget_spent_trigger
  after insert or update or delete on transactions
  for each row
  when (new.type = 'expense' or old.type = 'expense')
  execute function update_budget_spent();

create trigger update_debt_status_trigger
  after insert or update on debts
  for each statement
  execute function update_debt_status();

-- Create policies for transactions
create policy "Cho phép xem giao dịch của user" on transactions
  for select to authenticated
  using (user_id = auth.uid());

create policy "Cho phép thêm giao dịch" on transactions
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "Cho phép cập nhật giao dịch của user" on transactions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Cho phép xóa giao dịch của user" on transactions
  for delete to authenticated
  using (user_id = auth.uid());

-- Create policies for budgets
create policy "Users can view own budgets"
  on budgets for select
  using ( auth.uid() = user_id );

create policy "Users can insert own budgets"
  on budgets for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own budgets"
  on budgets for update
  using ( auth.uid() = user_id );

create policy "Users can delete own budgets"
  on budgets for delete
  using ( auth.uid() = user_id );

-- Create policies for financial goals
create policy "Users can view own financial goals"
  on financial_goals for select
  using ( auth.uid() = user_id );

create policy "Users can insert own financial goals"
  on financial_goals for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own financial goals"
  on financial_goals for update
  using ( auth.uid() = user_id );

create policy "Users can delete own financial goals"
  on financial_goals for delete
  using ( auth.uid() = user_id );

-- Create policies for debts
create policy "Users can view own debts"
  on debts for select
  using ( auth.uid() = user_id );

create policy "Users can insert own debts"
  on debts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own debts"
  on debts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own debts"
  on debts for delete
  using ( auth.uid() = user_id );

-- Create policies for user preferences
create policy "Users can view own preferences"
  on user_preferences for select
  using ( auth.uid() = user_id );

create policy "Users can update own preferences"
  on user_preferences for update
  using ( auth.uid() = user_id );

create policy "Users can insert own preferences"
  on user_preferences for insert
  with check ( auth.uid() = user_id ); 