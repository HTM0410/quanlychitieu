-- Function để xóa các giao dịch liên quan khi xóa vay nợ
CREATE OR REPLACE FUNCTION delete_debt_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Xóa tất cả giao dịch liên quan đến khoản vay nợ
  DELETE FROM transactions
  WHERE user_id = OLD.user_id
    AND (
      -- Giao dịch tạo khi cập nhật trạng thái (thu nợ/trả nợ)
      notes LIKE 'Tự động tạo từ khoản vay nợ: ' || OLD.title || '%'
      -- Giao dịch tạo khi thêm khoản vay nợ (vay/cho vay)
      OR title LIKE 'Vay: ' || OLD.title
      OR title LIKE 'Cho vay: ' || OLD.title
    );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger để tự động xóa giao dịch khi xóa vay nợ
DROP TRIGGER IF EXISTS delete_debt_transactions_trigger ON debts;
CREATE TRIGGER delete_debt_transactions_trigger
  BEFORE DELETE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION delete_debt_transactions(); 