-- 1. Function để tự động tạo giao dịch khi tạo khoản vay nợ mới
CREATE OR REPLACE FUNCTION create_debt_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Tạo giao dịch tương ứng khi thêm mới vay nợ
  INSERT INTO transactions (
    user_id,
    title,
    amount,
    type,
    category_id,
    date,
    notes
  ) VALUES (
    NEW.user_id,
    CASE 
      WHEN NEW.type = 'vay' THEN 'Vay: ' || NEW.title
      ELSE 'Cho vay: ' || NEW.title
    END,
    NEW.amount,
    CASE 
      WHEN NEW.type = 'vay' THEN 'income'
      ELSE 'expense'
    END,
    CASE 
      WHEN NEW.type = 'vay' THEN 'bc985284-54a1-4a6a-bb59-e6997eb6ac51'  -- ID của danh mục "Vay"
      ELSE '862b2956-2e4b-4732-b0cd-1bb1f8112afa'  -- ID của danh mục "Cho vay"
    END,
    NEW.date,
    'Tự động tạo từ khoản vay nợ: ' || NEW.title || ' - ' || NEW.person_name
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Function để xóa các giao dịch liên quan khi xóa vay nợ
CREATE OR REPLACE FUNCTION delete_debt_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Xóa tất cả giao dịch liên quan đến khoản vay nợ
  DELETE FROM transactions
  WHERE user_id = OLD.user_id
    AND (
      -- Tìm theo notes (cho mọi loại giao dịch liên quan)
      notes LIKE 'Tự động tạo từ khoản vay nợ: ' || OLD.title || '%'
      -- Tìm theo tiêu đề (cho giao dịch ban đầu)
      OR title = 'Vay: ' || OLD.title 
      OR title = 'Cho vay: ' || OLD.title
      -- Tìm theo tiêu đề (cho giao dịch trả nợ/thu nợ)
      OR title = 'Trả nợ: ' || OLD.title
      OR title = 'Thu nợ: ' || OLD.title
    );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Tạo trigger mới
-- Trigger tạo giao dịch khi thêm mới khoản vay nợ
DROP TRIGGER IF EXISTS create_debt_transaction_trigger ON debts;
CREATE TRIGGER create_debt_transaction_trigger
  AFTER INSERT ON debts
  FOR EACH ROW
  EXECUTE FUNCTION create_debt_transaction();

-- Trigger xóa giao dịch khi xóa khoản vay nợ
DROP TRIGGER IF EXISTS delete_debt_transactions_trigger ON debts;
CREATE TRIGGER delete_debt_transactions_trigger
  BEFORE DELETE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION delete_debt_transactions(); 