-- Tạo lại mối quan hệ giữa budgets và categories
ALTER TABLE IF EXISTS budgets DROP CONSTRAINT IF EXISTS budgets_category_id_fkey;
ALTER TABLE budgets ADD CONSTRAINT budgets_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Cập nhật cache schema
NOTIFY pgrst, 'reload schema'; 