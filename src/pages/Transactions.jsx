import { useState, useEffect } from 'react'
import { FiPlus, FiFilter, FiEdit2, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import { supabase } from '../supabase/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const Transactions = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: ''
  })
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category_id: '',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  })

  useEffect(() => {
    if (user) {
      console.log('User ID:', user.id);
      fetchTransactions()
      fetchCategories()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      console.log('Đang lấy giao dịch...');
      let query = supabase
        .from('transactions')
        .select(`
          id,
          title,
          amount,
          type,
          date,
          notes,
          categories (
            id,
            name,
            color,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }
      if (filters.category !== 'all') {
        query = query.eq('category_id', filters.category)
      }
      if (filters.startDate) {
        query = query.gte('date', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate)
      }

      const { data, error } = await query
      console.log('Kết quả giao dịch:', data);
      console.log('Lỗi nếu có:', error);

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu giao dịch:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('Đang lấy danh mục...');
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, type, color')
        .eq('user_id', user.id)
        .order('type')
        .order('name');

      console.log('Kết quả danh mục:', data);
      console.log('Lỗi nếu có:', error);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh mục:', error);
    }
  };

  const handleAddTransaction = async () => {
    try {
      // Validate dữ liệu đầu vào
      if (!newTransaction.title?.trim()) {
        alert('Vui lòng nhập tiêu đề giao dịch!')
        return
      }
      if (!newTransaction.amount || newTransaction.amount <= 0) {
        alert('Vui lòng nhập số tiền hợp lệ!')
        return
      }
      if (!newTransaction.category_id) {
        alert('Vui lòng chọn danh mục!')
        return
      }

      setLoading(true)

      // Thêm giao dịch mới
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          title: newTransaction.title.trim(),
          amount: parseFloat(newTransaction.amount),
          type: newTransaction.type,
          category_id: newTransaction.category_id,
          date: newTransaction.date,
          notes: newTransaction.notes?.trim(),
          user_id: user.id
        })
        .select(`
          id,
          title,
          amount,
          type,
          date,
          notes,
          categories (
            id,
            name,
            color,
            type
          )
        `)
        .single()

      if (error) throw error

      // Cập nhật state
      setTransactions([data, ...transactions])
      
      // Reset form
      setNewTransaction({
        title: '',
        amount: '',
        type: 'expense',
        category_id: '',
        date: new Date().toISOString().slice(0, 10),
        notes: ''
      })
      
      setShowAddModal(false)
      alert('Thêm giao dịch thành công!')

    } catch (error) {
      console.error('Lỗi khi thêm giao dịch:', error)
      alert(error.message || 'Có lỗi xảy ra khi thêm giao dịch!')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTransaction = async () => {
    try {
      if (!editingTransaction.title?.trim()) {
        alert('Vui lòng nhập tiêu đề giao dịch!')
        return
      }
      if (!editingTransaction.amount || editingTransaction.amount <= 0) {
        alert('Vui lòng nhập số tiền hợp lệ!')
        return
      }
      if (!editingTransaction.category_id) {
        alert('Vui lòng chọn danh mục!')
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .update({
          title: editingTransaction.title.trim(),
          amount: parseFloat(editingTransaction.amount),
          type: editingTransaction.type,
          category_id: editingTransaction.category_id,
          date: editingTransaction.date,
          notes: editingTransaction.notes?.trim()
        })
        .eq('id', editingTransaction.id)
        .select(`
          id,
          title,
          amount,
          type,
          date,
          notes,
          categories (
            id,
            name,
            color,
            type
          )
        `)
        .single()

      if (error) throw error

      setTransactions(transactions.map(t => 
        t.id === editingTransaction.id ? data : t
      ))
      setEditingTransaction(null)
      alert('Cập nhật giao dịch thành công!')
    } catch (error) {
      console.error('Lỗi khi cập nhật giao dịch:', error)
      alert(error.message || 'Có lỗi xảy ra khi cập nhật giao dịch!')
    }
  }

  const handleDeleteTransaction = async (id) => {
    if (confirm('Bạn có chắc muốn xóa giao dịch này?')) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)

        if (error) throw error

        setTransactions(transactions.filter(t => t.id !== id))
      } catch (error) {
        console.error('Lỗi khi xóa giao dịch:', error)
        alert('Có lỗi xảy ra khi xóa giao dịch!')
      }
    }
  }

  const handleApplyFilters = () => {
    fetchTransactions()
    setShowFilterModal(false)
  }

  // Format tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Hàm lọc danh mục theo loại (thu/chi)
  const getFilteredCategories = (type) => {
    const filtered = categories.filter(cat => cat.type === type);
    console.log(`Danh mục đã lọc (${type}):`, filtered);
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý giao dịch</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowFilterModal(true)}
            className="flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-white/20"
          >
            <FiFilter className="mr-2" />
            Lọc
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 rounded-lg gradient-bg text-white"
          >
            <FiPlus className="mr-2" />
            Thêm giao dịch
          </button>
        </div>
      </div>

      {/* Danh sách giao dịch */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4">Ngày</th>
                <th className="text-left p-4">Tiêu đề</th>
                <th className="text-left p-4">Danh mục</th>
                <th className="text-left p-4">Số tiền</th>
                <th className="text-left p-4">Ghi chú</th>
                <th className="text-right p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-white/20">
                    <td className="p-4">
                      {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: vi })}
                    </td>
                    <td className="p-4">{transaction.title}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${transaction.categories?.color}`}>
                        {transaction.categories?.name}
                      </span>
                    </td>
                    <td className={`p-4 font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </td>
                    <td className="p-4 text-gray-600">{transaction.notes}</td>
                    <td className="p-4">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setEditingTransaction(transaction)}
                          className="p-2 hover:bg-white/20 rounded-lg"
                        >
                          <FiEdit2 className="text-primary-600" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-2 hover:bg-white/20 rounded-lg"
                        >
                          <FiTrash2 className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Chưa có giao dịch nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal thêm giao dịch */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Thêm giao dịch mới</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newTransaction.title}
                  onChange={(e) => setNewTransaction({...newTransaction, title: e.target.value})}
                  placeholder="Nhập tiêu đề giao dịch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary-600"
                      checked={newTransaction.type === 'expense'}
                      onChange={() => setNewTransaction({...newTransaction, type: 'expense'})}
                    />
                    <span className="ml-2">Chi tiêu</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary-600"
                      checked={newTransaction.type === 'income'}
                      onChange={() => setNewTransaction({...newTransaction, type: 'income'})}
                    />
                    <span className="ml-2">Thu nhập</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  placeholder="Nhập số tiền"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newTransaction.category_id}
                  onChange={(e) => setNewTransaction({...newTransaction, category_id: e.target.value})}
                >
                  <option value="">Chọn danh mục</option>
                  {getFilteredCategories(newTransaction.type).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                  placeholder="Nhập ghi chú (không bắt buộc)"
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                onClick={() => setShowAddModal(false)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 gradient-bg text-white rounded-lg"
                onClick={handleAddTransaction}
              >
                Thêm giao dịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa giao dịch */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa giao dịch</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingTransaction.title}
                  onChange={(e) => setEditingTransaction({...editingTransaction, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary-600"
                      checked={editingTransaction.type === 'expense'}
                      onChange={() => setEditingTransaction({...editingTransaction, type: 'expense'})}
                    />
                    <span className="ml-2">Chi tiêu</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary-600"
                      checked={editingTransaction.type === 'income'}
                      onChange={() => setEditingTransaction({...editingTransaction, type: 'income'})}
                    />
                    <span className="ml-2">Thu nhập</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction({...editingTransaction, amount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingTransaction.category_id}
                  onChange={(e) => setEditingTransaction({...editingTransaction, category_id: e.target.value})}
                >
                  <option value="">Chọn danh mục</option>
                  {getFilteredCategories(editingTransaction.type).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingTransaction.notes}
                  onChange={(e) => setEditingTransaction({...editingTransaction, notes: e.target.value})}
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                onClick={() => setEditingTransaction(null)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 gradient-bg text-white rounded-lg"
                onClick={handleEditTransaction}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal lọc */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Lọc giao dịch</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="all">Tất cả</option>
                  <option value="expense">Chi tiêu</option>
                  <option value="income">Thu nhập</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="all">Tất cả</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                onClick={() => setShowFilterModal(false)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 gradient-bg text-white rounded-lg"
                onClick={handleApplyFilters}
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions
