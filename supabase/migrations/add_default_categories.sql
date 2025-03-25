-- Xóa các danh mục cũ nếu có
delete from categories where user_id = auth.uid();

-- Thêm danh mục mặc định cho chi tiêu
insert into categories (user_id, name, type, color)
values
  (auth.uid(), 'Ăn uống', 'expense', 'bg-red-500'),
  (auth.uid(), 'Di chuyển', 'expense', 'bg-blue-500'),
  (auth.uid(), 'Mua sắm', 'expense', 'bg-purple-500'),
  (auth.uid(), 'Hóa đơn & Tiện ích', 'expense', 'bg-yellow-500'),
  (auth.uid(), 'Giải trí', 'expense', 'bg-green-500'),
  (auth.uid(), 'Sức khỏe', 'expense', 'bg-pink-500'),
  (auth.uid(), 'Giáo dục', 'expense', 'bg-indigo-500'),
  (auth.uid(), 'Khác', 'expense', 'bg-gray-500');

-- Thêm danh mục mặc định cho thu nhập  
insert into categories (user_id, name, type, color)
values
  (auth.uid(), 'Lương', 'income', 'bg-emerald-500'),
  (auth.uid(), 'Thưởng', 'income', 'bg-amber-500'), 
  (auth.uid(), 'Đầu tư', 'income', 'bg-cyan-500'),
  (auth.uid(), 'Được tặng', 'income', 'bg-lime-500'),
  (auth.uid(), 'Thu nhập phụ', 'income', 'bg-orange-500'),
  (auth.uid(), 'Khác', 'income', 'bg-slate-500'); 