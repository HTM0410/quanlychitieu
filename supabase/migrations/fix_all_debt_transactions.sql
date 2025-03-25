-- Function cải tiến để xóa tất cả các giao dịch liên quan khi xóa vay nợ
CREATE OR REPLACE FUNCTION delete_debt_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Xóa tất cả giao dịch liên quan đến khoản vay nợ
  DELETE FROM transactions
  WHERE user_id = OLD.user_id
    AND (
      -- Tìm theo notes (cho mọi loại giao dịch liên quan)
      notes LIKE '%khoản vay nợ: ' || OLD.title || '%'
      OR notes LIKE '%' || OLD.title || ' - ' || OLD.person_name || '%'
      
      -- Tìm theo tiêu đề chính xác (cho tất cả các loại giao dịch)
      OR title = 'Vay: ' || OLD.title 
      OR title = 'Cho vay: ' || OLD.title
      OR title = 'Trả nợ: ' || OLD.title
      OR title = 'Thu nợ: ' || OLD.title
    );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Cập nhật trigger
DROP TRIGGER IF EXISTS delete_debt_transactions_trigger ON debts;
CREATE TRIGGER delete_debt_transactions_trigger
  BEFORE DELETE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION delete_debt_transactions(); 