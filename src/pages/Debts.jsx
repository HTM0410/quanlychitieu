import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi'
import { supabase } from '../supabase/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Các ID danh mục vay nợ
const CATEGORY_IDS = {
  VAY: 'bc985284-54a1-4a6a-bb59-e6997eb6ac51',
  CHO_VAY: '862b2956-2e4b-4732-b0cd-1bb1f8112afa',
  TRA_NO: 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a',
  THU_NO: 'e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b'
}

const Debts = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [debts, setDebts] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDebt, setEditingDebt] = useState(null)
  const [newDebt, setNewDebt] = useState({
    title: '',
    amount: '',
    type: 'vay',
    person_name: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'chưa_trả'
  })
  
  useEffect(() => {
    if (user) {
      fetchDebts()
    }
  }, [user])
  
  // Format tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  // Lấy danh sách vay nợ
  const fetchDebts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      
      if (error) throw error
      setDebts(data || [])
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vay nợ:', error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Thêm vay nợ mới
  const handleAddDebt = async () => {
    if (!newDebt.title || !newDebt.amount || !newDebt.person_name) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!')
      return
    }
    
    try {
      const { data: debtData, error: debtError } = await supabase
        .from('debts')
        .insert({
          user_id: user.id,
          title: newDebt.title.trim(),
          amount: parseFloat(newDebt.amount),
          type: newDebt.type,
          person_name: newDebt.person_name.trim(),
          notes: newDebt.notes?.trim(),
          date: newDebt.date,
          status: 'chưa_trả'
        })
        .select()
        .single()

      if (debtError) throw debtError

      // Tạo giao dịch tương ứng
      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          title: newDebt.type === 'vay' ? 'Vay: ' + newDebt.title : 'Cho vay: ' + newDebt.title,
          amount: parseFloat(newDebt.amount),
          type: newDebt.type === 'vay' ? 'income' : 'expense',
          category_id: newDebt.type === 'vay' 
            ? CATEGORY_IDS.VAY
            : CATEGORY_IDS.CHO_VAY,
          date: newDebt.date,
          notes: `Tự động tạo từ khoản ${newDebt.type === 'vay' ? 'vay' : 'cho vay'}: ${newDebt.title} - ${newDebt.person_name}`
        })

      if (transError) throw transError

      setShowAddModal(false)
      setNewDebt({
        title: '',
        amount: '',
        type: 'vay',
        person_name: '',
        notes: '',
        date: format(new Date(), 'yyyy-MM-dd')
      })
      fetchDebts()
    } catch (error) {
      console.error('Lỗi khi thêm vay nợ:', error)
      alert('Có lỗi xảy ra khi thêm vay nợ!')
    }
  }
  
  // Cập nhật trạng thái vay nợ
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { data: updatedDebt, error: debtError } = await supabase
        .from('debts')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single()

      if (debtError) throw debtError

      // Tạo giao dịch tương ứng khi hoàn thành thanh toán
      if (newStatus === 'đã_trả') {
        const { error: transError } = await supabase
          .from('transactions')
          .insert({
            user_id: updatedDebt.user_id,
            title: updatedDebt.type === 'vay' ? 'Trả nợ: ' + updatedDebt.title : 'Thu nợ: ' + updatedDebt.title,
            amount: updatedDebt.amount,
            type: updatedDebt.type === 'vay' ? 'expense' : 'income',
            category_id: updatedDebt.type === 'vay' 
              ? CATEGORY_IDS.TRA_NO
              : CATEGORY_IDS.THU_NO,
            date: new Date().toISOString().slice(0, 10),
            notes: `Tự động tạo từ khoản ${updatedDebt.type === 'vay' ? 'vay' : 'cho vay'}: ${updatedDebt.title} - ${updatedDebt.person_name}`
          })

        if (transError) throw transError
      }

      fetchDebts()
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error.message)
      alert('Có lỗi xảy ra khi cập nhật trạng thái!')
    }
  }
  
  // Cập nhật thông tin vay nợ
  const handleUpdateDebt = async () => {
    if (!editingDebt.title || !editingDebt.amount || !editingDebt.person_name) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!')
      return
    }
    
    try {
      const { error } = await supabase
        .from('debts')
        .update({
          title: editingDebt.title,
          amount: parseFloat(editingDebt.amount),
          type: editingDebt.type,
          person_name: editingDebt.person_name,
          notes: editingDebt.notes,
          date: editingDebt.date
        })
        .eq('id', editingDebt.id)
      
      if (error) throw error
      
      setEditingDebt(null)
      fetchDebts()
    } catch (error) {
      console.error('Lỗi khi cập nhật vay nợ:', error.message)
      alert('Có lỗi xảy ra khi cập nhật vay nợ!')
    }
  }
  
  // Xóa vay nợ
  const handleDeleteDebt = async (id) => {
    if (confirm('Bạn có chắc muốn xóa khoản vay nợ này?')) {
      try {
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        fetchDebts()
      } catch (error) {
        console.error('Lỗi khi xóa vay nợ:', error.message)
        alert('Có lỗi xảy ra khi xóa vay nợ!')
      }
    }
  }
  
  // Tính tổng vay nợ
  const calculateTotal = () => {
    return debts.reduce((sum, debt) => {
      if (debt.type === 'vay') {
        return sum - (debt.status === 'chưa_trả' ? debt.amount : 0)
      } else {
        return sum + (debt.status === 'chưa_trả' ? debt.amount : 0)
      }
    }, 0)
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
        <h1 className="text-2xl font-bold text-gray-800">Quản lý vay nợ</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 rounded-lg gradient-bg text-white font-medium"
        >
          <FiPlus className="mr-2" />
          Thêm vay nợ
        </button>
      </div>
      
      {/* Tổng quan vay nợ */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Tổng quan vay nợ</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Tổng vay nợ</h3>
            <p className={`text-2xl font-bold mt-2 ${calculateTotal() >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(calculateTotal())}
            </p>
          </div>
          
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Đang vay</h3>
            <p className="text-2xl font-bold mt-2 text-red-500">
              {formatCurrency(debts.reduce((sum, debt) => 
                sum + (debt.type === 'vay' && debt.status === 'chưa_trả' ? debt.amount : 0), 0
              ))}
            </p>
          </div>
          
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Đang cho vay</h3>
            <p className="text-2xl font-bold mt-2 text-green-600">
              {formatCurrency(debts.reduce((sum, debt) => 
                sum + (debt.type === 'cho_vay' && debt.status === 'chưa_trả' ? debt.amount : 0), 0
              ))}
            </p>
          </div>
        </div>
      </div>
      
      {/* Danh sách vay nợ */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Danh sách vay nợ</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3">Tiêu đề</th>
                <th className="pb-3">Người vay/cho vay</th>
                <th className="pb-3">Số tiền</th>
                <th className="pb-3">Ngày</th>
                <th className="pb-3">Trạng thái</th>
                <th className="pb-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => (
                <tr key={debt.id} className="border-b border-gray-100">
                  <td className="py-3">{debt.title}</td>
                  <td className="py-3">{debt.person_name}</td>
                  <td className={`py-3 font-medium ${debt.type === 'vay' ? 'text-red-500' : 'text-green-600'}`}>
                    {debt.type === 'vay' ? '-' : '+'} {formatCurrency(debt.amount)}
                  </td>
                  <td className="py-3">{format(new Date(debt.date), 'dd/MM/yyyy', { locale: vi })}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      debt.status === 'chưa_trả' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {debt.status === 'chưa_trả' ? 'Chưa trả' : 'Đã trả'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      {debt.status === 'chưa_trả' && (
                        <button 
                          className="text-green-600 hover:text-green-800"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn đánh dấu khoản ${debt.type === 'vay' ? 'vay' : 'cho vay'} này là đã trả?\nHệ thống sẽ tự động tạo một giao dịch tương ứng.`)) {
                              handleUpdateStatus(debt.id, 'đã_trả')
                            }
                          }}
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button 
                        className="text-primary-600 hover:text-primary-800"
                        onClick={() => setEditingDebt(debt)}
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteDebt(debt.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal thêm vay nợ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Thêm vay nợ mới</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newDebt.title}
                  onChange={(e) => setNewDebt({...newDebt, title: e.target.value})}
                  placeholder="Ví dụ: Vay tiền mua xe, Cho vay tiền học..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newDebt.type}
                  onChange={(e) => setNewDebt({...newDebt, type: e.target.value})}
                >
                  <option value="vay">Vay</option>
                  <option value="cho_vay">Cho vay</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người vay/cho vay</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newDebt.person_name}
                  onChange={(e) => setNewDebt({...newDebt, person_name: e.target.value})}
                  placeholder="Tên người vay hoặc cho vay"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newDebt.amount}
                  onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
                  placeholder="Nhập số tiền"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newDebt.date}
                  onChange={(e) => setNewDebt({...newDebt, date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newDebt.notes}
                  onChange={(e) => setNewDebt({...newDebt, notes: e.target.value})}
                  placeholder="Ghi chú (tùy chọn)"
                  rows="3"
                />
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
                onClick={handleAddDebt}
              >
                Thêm vay nợ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa vay nợ */}
      {editingDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa vay nợ</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingDebt.title}
                  onChange={(e) => setEditingDebt({...editingDebt, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingDebt.type}
                  onChange={(e) => setEditingDebt({...editingDebt, type: e.target.value})}
                >
                  <option value="vay">Vay</option>
                  <option value="cho_vay">Cho vay</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người vay/cho vay</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingDebt.person_name}
                  onChange={(e) => setEditingDebt({...editingDebt, person_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingDebt.amount}
                  onChange={(e) => setEditingDebt({...editingDebt, amount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingDebt.date}
                  onChange={(e) => setEditingDebt({...editingDebt, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingDebt.notes}
                  onChange={(e) => setEditingDebt({...editingDebt, notes: e.target.value})}
                  rows="3"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                onClick={() => setEditingDebt(null)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 gradient-bg text-white rounded-lg"
                onClick={handleUpdateDebt}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Debts 