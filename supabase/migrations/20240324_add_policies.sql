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

-- Create trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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