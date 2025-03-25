import { useState, useEffect } from 'react'
import { FiPlus, FiFilter, FiEdit2, FiTrash2, FiArrowUp, FiArrowDown, FiDownload } from 'react-icons/fi'
import { supabase } from '../supabase/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants/defaultCategories'

const Transactions = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [customCategories, setCustomCategories] = useState([])
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
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  })

  // Kết hợp danh mục mặc định và tùy chỉnh
  const allCategories = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
    ...customCategories
  ]

  useEffect(() => {
    if (user) {
      console.log('User ID:', user.id);
      fetchTransactions()
      fetchCustomCategories()
    }
  }, [user])

  const fetchCustomCategories = async () => {
    try {
      console.log('Đang lấy danh mục...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type')
        .order('name')

      console.log('Kết quả danh mục:', data);
      console.log('Lỗi nếu có:', error);

      if (error) throw error;
      setCustomCategories(data || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh mục:', error);
    }
  };

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
          category_id
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

      // Xử lý dữ liệu giao dịch
      const processedTransactions = data.map(transaction => {
        // Tìm category trong tất cả danh mục
        const category = allCategories.find(cat => cat.id === transaction.category_id)

        return {
          ...transaction,
          category: category || { name: 'Không có danh mục', color: 'bg-gray-500' }
        }
      })

      setTransactions(processedTransactions)
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu giao dịch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    try {
      if (!newTransaction.title || !newTransaction.amount || !newTransaction.category_id) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!')
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...newTransaction,
          user_id: user.id,
          amount: parseFloat(newTransaction.amount)
        })
        .select()

      if (error) throw error

      // Tìm category cho giao dịch mới
      const category = allCategories.find(cat => cat.id === data[0].category_id)
      const newTransactionWithCategory = {
        ...data[0],
        category: category || { name: 'Không có danh mục', color: 'bg-gray-500' }
      }

      setTransactions([newTransactionWithCategory, ...transactions])
      setShowAddModal(false)
      setNewTransaction({
        title: '',
        amount: '',
        type: 'expense',
        category_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      })
    } catch (error) {
      console.error('Lỗi khi thêm giao dịch:', error)
      alert('Có lỗi xảy ra khi thêm giao dịch!')
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
        .select()

      if (error) throw error

      // Tìm category cho giao dịch đã cập nhật
      const category = allCategories.find(cat => cat.id === data[0].category_id)
      const updatedTransaction = {
        ...data[0],
        category: category || { name: 'Không có danh mục', color: 'bg-gray-500' }
      }

      setTransactions(transactions.map(t => 
        t.id === editingTransaction.id ? updatedTransaction : t
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

  const handleExport = () => {
    // Xử lý xuất dữ liệu
  }

  // Format tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount)
  }

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
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilterModal(true)}
            className="px-4 py-2 flex items-center text-gray-700 bg-white rounded-lg hover:bg-gray-50"
          >
            <FiFilter className="mr-2" />
            Lọc
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 flex items-center text-gray-700 bg-white rounded-lg hover:bg-gray-50"
          >
            <FiDownload className="mr-2" />
            Xuất
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 flex items-center gradient-bg text-white rounded-lg"
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
              <tr className="text-left border-b border-gray-200">
                <th className="px-6 py-3 text-gray-500 font-medium">Ngày</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Tiêu đề</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Danh mục</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Số tiền</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Ghi chú</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-white/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: vi })}
                  </td>
                  <td className="px-6 py-4">{transaction.title}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${transaction.category?.color || 'bg-gray-400'} mr-2`}></div>
                      {transaction.category?.name || 'Không có danh mục'}
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{transaction.notes || '---'}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => setEditingTransaction(transaction)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                      onChange={() => setNewTransaction({
                        ...newTransaction,
                        type: 'expense',
                        category_id: '' // Reset category when changing type
                      })}
                    />
                    <span className="ml-2">Chi tiêu</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary-600"
                      checked={newTransaction.type === 'income'}
                      onChange={() => setNewTransaction({
                        ...newTransaction,
                        type: 'income',
                        category_id: '' // Reset category when changing type
                      })}
                    />
                    <span className="ml-2">Thu nhập</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newTransaction.category_id || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, category_id: e.target.value})}
                >
                  <option value="">Chọn danh mục</option>
                  {allCategories
                    .filter(cat => cat.type === newTransaction.type)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  }
                </select>
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
                  value={editingTransaction.category_id || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, category_id: e.target.value})}
                >
                  <option value="">Chọn danh mục</option>
                  {allCategories
                    .filter(cat => cat.type === editingTransaction.type)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  }
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
                  <option value="all">Tất cả danh mục</option>
                  {allCategories.map(category => (
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
