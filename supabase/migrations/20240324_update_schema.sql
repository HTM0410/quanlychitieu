-- Tạo extension nếu chưa có
create extension if not exists "uuid-ossp";

-- Xóa các bảng cũ nếu tồn tại
drop table if exists user_preferences cascade;
drop table if exists debts cascade;
drop table if exists financial_goals cascade;
drop table if exists budgets cascade;
drop table if exists transactions cascade;
drop table if exists categories cascade;
drop table if exists profiles cascade;

-- Tạo lại các bảng với cấu trúc mới
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
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, name)
);

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount decimal not null,
  type text not null check (type in ('income', 'expense')),
  category_id uuid references categories(id) on delete set null,
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

-- Enable Row Level Security
alter table profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table financial_goals enable row level security;
alter table debts enable row level security;
alter table user_preferences enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can view their own categories"
  on categories for select
  using (auth.uid() = user_id);

create policy "Users can create their own categories"
  on categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on categories for delete
  using (auth.uid() = user_id);

create policy "Users can view their own transactions"
  on transactions for select
  using (auth.uid() = user_id);

create policy "Users can create their own transactions"
  on transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on transactions for delete
  using (auth.uid() = user_id);

-- Tạo trigger function để tự động cập nhật updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Tạo triggers cho các bảng
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