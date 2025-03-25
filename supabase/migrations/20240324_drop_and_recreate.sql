-- Xóa các bảng hiện có
drop table if exists user_preferences cascade;
drop table if exists debts cascade;
drop table if exists financial_goals cascade;
drop table if exists budgets cascade;
drop table if exists transactions cascade;
drop table if exists categories cascade;
drop table if exists profiles cascade;

-- Tạo extension nếu chưa có
create extension if not exists "uuid-ossp";

-- Tạo lại các bảng
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