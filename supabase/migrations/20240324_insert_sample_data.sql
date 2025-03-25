-- Thêm danh mục mẫu
insert into categories (user_id, name, type, color) values
  ('your_user_id', 'Ăn uống', 'expense', 'bg-red-500'),
  ('your_user_id', 'Di chuyển', 'expense', 'bg-blue-500'),
  ('your_user_id', 'Mua sắm', 'expense', 'bg-green-500'),
  ('your_user_id', 'Giải trí', 'expense', 'bg-yellow-500'),
  ('your_user_id', 'Tiền nhà', 'expense', 'bg-purple-500'),
  ('your_user_id', 'Lương', 'income', 'bg-emerald-500'),
  ('your_user_id', 'Thưởng', 'income', 'bg-cyan-500'),
  ('your_user_id', 'Đầu tư', 'income', 'bg-indigo-500');

-- Thêm giao dịch mẫu
insert into transactions (user_id, title, amount, type, category_id, date, notes) 
select 
  'your_user_id',
  'Ăn trưa văn phòng',
  50000,
  'expense',
  id,
  current_date,
  'Cơm văn phòng'
from categories 
where name = 'Ăn uống' and user_id = 'your_user_id';

insert into transactions (user_id, title, amount, type, category_id, date, notes)
select
  'your_user_id',
  'Lương tháng 3',
  15000000,
  'income',
  id,
  current_date,
  'Lương cơ bản'
from categories
where name = 'Lương' and user_id = 'your_user_id';

-- Thêm ngân sách mẫu
insert into budgets (user_id, category_id, amount, month)
select
  'your_user_id',
  id,
  2000000,
  date_trunc('month', current_date)
from categories
where name = 'Ăn uống' and user_id = 'your_user_id';

-- Thêm mục tiêu tài chính mẫu
insert into financial_goals (user_id, title, target_amount, current_amount, deadline)
values (
  'your_user_id',
  'Mua laptop mới',
  25000000,
  5000000,
  current_date + interval '6 months'
);

-- Thêm khoản vay nợ mẫu
insert into debts (user_id, title, amount, type, person_name, description, due_date)
values (
  'your_user_id',
  'Cho bạn vay',
  1000000,
  'lend',
  'Nguyễn Văn A',
  'Cho vay mua điện thoại',
  current_date + interval '1 month'
);

-- Thêm tùy chọn người dùng
insert into user_preferences (user_id, currency, language, financial_month_start)
values (
  'your_user_id',
  'VND',
  'vi',
  1
); 