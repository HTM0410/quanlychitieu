-- Xóa ràng buộc khóa ngoại hiện tại nếu tồn tại
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_id_fkey;

-- Thêm ràng buộc khóa ngoại mới
ALTER TABLE budgets ADD CONSTRAINT budgets_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Cập nhật schema cache
NOTIFY pgrst, 'reload schema';

-- Thông báo
SELECT 'Mối quan hệ khóa ngoại đã được thiết lập lại giữa bảng budgets và categories' as message; 