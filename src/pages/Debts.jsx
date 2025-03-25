import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { supabase } from '../supabase/supabaseClient'

const Debts = () => {
  const [debts, setDebts] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDebt, setNewDebt] = useState({
    title: '',
    amount: '',
    type: 'borrow',
    person_name: '',
    description: '',
    due_date: '',
    status: 'pending'
  })
  
  // Format tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  // Format ngày tháng
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN')
  }
  
  // Lấy danh sách vay nợ
  const fetchDebts = async () => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDebts(data)
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vay nợ:', error.message)
    }
  }
  
  useEffect(() => {
    fetchDebts()
  }, [])
  
  // Thêm vay nợ mới
  const handleAddDebt = async () => {
    if (!newDebt.title || !newDebt.amount || !newDebt.person_name) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!')
      return
    }
    
    try {
      const { error } = await supabase
        .from('debts')
        .insert([{
          ...newDebt,
          amount: parseFloat(newDebt.amount)
        }])
      
      if (error) throw error
      
      setNewDebt({
        title: '',
        amount: '',
        type: 'borrow',
        person_name: '',
        description: '',
        due_date: '',
        status: 'pending'
      })
      setShowAddModal(false)
      fetchDebts()
    } catch (error) {
      console.error('Lỗi khi thêm vay nợ:', error.message)
      alert('Có lỗi xảy ra khi thêm vay nợ!')
    }
  }
  
  // Cập nhật trạng thái vay nợ
  const handleUpdateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('debts')
        .update({ status })
        .eq('id', id)
      
      if (error) throw error
      fetchDebts()
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error.message)
      alert('Có lỗi xảy ra khi cập nhật trạng thái!')
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
      if (debt.type === 'borrow') {
        return sum + (debt.status === 'pending' ? debt.amount : 0)
      } else {
        return sum - (debt.status === 'pending' ? debt.amount : 0)
      }
    }, 0)
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
                sum + (debt.type === 'borrow' && debt.status === 'pending' ? debt.amount : 0), 0
              ))}
            </p>
          </div>
          
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Đang cho vay</h3>
            <p className="text-2xl font-bold mt-2 text-green-600">
              {formatCurrency(debts.reduce((sum, debt) => 
                sum + (debt.type === 'lend' && debt.status === 'pending' ? debt.amount : 0), 0
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
                <th className="pb-3">Ngày đến hạn</th>
                <th className="pb-3">Trạng thái</th>
                <th className="pb-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => (
                <tr key={debt.id} className="border-b border-gray-100">
                  <td className="py-3">{debt.title}</td>
                  <td className="py-3">{debt.person_name}</td>
                  <td className={`py-3 font-medium ${debt.type === 'borrow' ? 'text-red-500' : 'text-green-600'}`}>
                    {debt.type === 'borrow' ? '-' : '+'} {formatCurrency(debt.amount)}
                  </td>
                  <td className="py-3">{formatDate(debt.due_date)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      debt.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : debt.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {debt.status === 'pending' ? 'Chưa trả' : debt.status === 'paid' ? 'Đã trả' : 'Quá hạn'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      {debt.status === 'pending' && (
                        <>
                          <button 
                            className="text-green-600 hover:text-green-800"
                            onClick={() => handleUpdateStatus(debt.id, 'paid')}
                          >
                            <FiCheck />
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleUpdateStatus(debt.id, 'overdue')}
                          >
                            <FiX />
                          </button>
                        </>
                      )}
                      <button 
                        className="text-primary-600 hover:text-primary-800"
                        onClick={() => {/* TODO: Implement edit */}}
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
                  <option value="borrow">Vay</option>
                  <option value="lend">Cho vay</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đến hạn</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newDebt.due_date}
                  onChange={(e) => setNewDebt({...newDebt, due_date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newDebt.description}
                  onChange={(e) => setNewDebt({...newDebt, description: e.target.value})}
                  placeholder="Mô tả chi tiết (tùy chọn)"
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
    </div>
  )
}

export default Debts 