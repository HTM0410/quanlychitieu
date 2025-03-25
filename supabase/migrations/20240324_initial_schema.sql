-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing triggers
drop trigger if exists on_auth_user_created on auth.users;

-- Drop existing tables if they exist
drop table if exists budgets cascade;
drop table if exists transactions cascade;
drop table if exists categories cascade;
drop table if exists financial_goals cascade;
drop table if exists debts cascade;
drop table if exists user_preferences cascade;
drop table if exists profiles cascade;

-- Create profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create categories table
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- Create transactions table
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  amount decimal not null,
  type text not null check (type in ('income', 'expense')),
  category_id uuid references categories(id) on delete set null,
  date date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create budgets table
create table if not exists budgets (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references categories on delete cascade,
  user_id uuid references auth.users on delete cascade,
  amount decimal not null,
  spent decimal default 0,
  month date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create financial_goals table
create table if not exists financial_goals (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  target_amount decimal not null,
  current_amount decimal default 0,
  deadline date,
  user_id uuid references auth.users on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create debts table
create table if not exists debts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  amount decimal not null,
  type text not null check (type in ('borrow', 'lend')),
  person_name text not null,
  description text,
  due_date date,
  status text not null check (status in ('pending', 'paid', 'overdue')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_preferences table
create table if not exists user_preferences (
  user_id uuid references auth.users on delete cascade primary key,
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table financial_goals enable row level security;
alter table debts enable row level security;
alter table user_preferences enable row level security;

-- Create function to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Tạo danh mục mặc định cho chi tiêu
  insert into public.categories (user_id, name, type, color)
  values
    (new.id, 'Ăn uống', 'expense', 'bg-red-500'),
    (new.id, 'Di chuyển', 'expense', 'bg-blue-500'),
    (new.id, 'Mua sắm', 'expense', 'bg-purple-500'),
    (new.id, 'Hóa đơn & Tiện ích', 'expense', 'bg-yellow-500'),
    (new.id, 'Giải trí', 'expense', 'bg-green-500'),
    (new.id, 'Sức khỏe', 'expense', 'bg-pink-500'),
    (new.id, 'Giáo dục', 'expense', 'bg-indigo-500'),
    (new.id, 'Khác', 'expense', 'bg-gray-500');

  -- Tạo danh mục mặc định cho thu nhập  
  insert into public.categories (user_id, name, type, color)
  values
    (new.id, 'Lương', 'income', 'bg-emerald-500'),
    (new.id, 'Thưởng', 'income', 'bg-amber-500'), 
    (new.id, 'Đầu tư', 'income', 'bg-cyan-500'),
    (new.id, 'Được tặng', 'income', 'bg-lime-500'),
    (new.id, 'Thu nhập phụ', 'income', 'bg-orange-500'),
    (new.id, 'Khác', 'income', 'bg-slate-500');

  return new;
end;
$$;

-- Create function to update budget spent
create or replace function update_budget_spent()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    -- Cập nhật số tiền đã chi khi thêm giao dịch mới
    update budgets
    set spent = spent + new.amount
    where user_id = new.user_id
      and category_id = new.category_id
      and month = date_trunc('month', new.date);
  elsif (TG_OP = 'UPDATE') then
    -- Hoàn lại số tiền cũ và cập nhật số tiền mới
    update budgets
    set spent = spent - old.amount + new.amount
    where user_id = new.user_id
      and category_id = new.category_id
      and month = date_trunc('month', new.date);
  elsif (TG_OP = 'DELETE') then
    -- Hoàn lại số tiền khi xóa giao dịch
    update budgets
    set spent = spent - old.amount
    where user_id = old.user_id
      and category_id = old.category_id
      and month = date_trunc('month', old.date);
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Create trigger to update budget spent
drop trigger if exists update_budget_spent_trigger on transactions;
create trigger update_budget_spent_trigger
  after insert or update or delete on transactions
  for each row
  when (new.type = 'expense' or old.type = 'expense')
  execute function update_budget_spent();

-- Create function to update debt status
create or replace function update_debt_status()
returns trigger as $$
begin
  -- Tự động cập nhật trạng thái quá hạn
  update debts
  set status = 'overdue'
  where status = 'pending'
    and due_date < current_date;
  return null;
end;
$$ language plpgsql security definer;

-- Create trigger to update debt status
drop trigger if exists update_debt_status_trigger on debts;
create trigger update_debt_status_trigger
  after insert or update on debts
  for each statement
  execute function update_debt_status();

-- Create triggers
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create indexes for optimization
create index if not exists debts_user_id_idx on debts(user_id);
create index if not exists debts_status_idx on debts(status);
create index if not exists debts_type_idx on debts(type);

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
create policy "Users can view their own categories"
  on categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on categories for delete
  using (auth.uid() = user_id);

-- Create policies for transactions
create policy "Users can view own transactions"
  on transactions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own transactions"
  on transactions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own transactions"
  on transactions for update
  using ( auth.uid() = user_id );

create policy "Users can delete own transactions"
  on transactions for delete
  using ( auth.uid() = user_id );

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

-- Create index for transactions
create index if not exists transactions_user_id_idx on transactions(user_id);
create index if not exists transactions_category_id_idx on transactions(category_id);
create index if not exists transactions_date_idx on transactions(date);
create index if not exists transactions_type_idx on transactions(type);

-- Create index for budgets
create index if not exists budgets_user_id_idx on budgets(user_id);
create index if not exists budgets_category_id_idx on budgets(category_id);
create index if not exists budgets_month_idx on budgets(month);

-- Create index for financial goals
create index if not exists financial_goals_user_id_idx on financial_goals(user_id);
create index if not exists financial_goals_deadline_idx on financial_goals(deadline); 