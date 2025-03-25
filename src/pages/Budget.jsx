import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { supabase } from '../supabase/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import useNumberFormat from '../hooks/useNumberFormat'

const Budget = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit: '',
    spent: 0,
    color: 'from-blue-500 to-cyan-400'
  })
  
  // Custom hook cho việc định dạng số tiền
  const [displayLimit, actualLimit, handleLimitChange] = useNumberFormat(newBudget.limit)
  
  // Cập nhật actualLimit vào newBudget
  useEffect(() => {
    setNewBudget(prev => ({...prev, limit: actualLimit}))
  }, [actualLimit])

  useEffect(() => {
    if (user) {
      fetchBudgets()
    }
  }, [user])

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      
      // Lấy ngân sách và số tiền đã chi tiêu
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select(`
          id,
          amount,
          categories (
            id,
            name,
            color
          ),
          month
        `)
        .eq('user_id', user.id)
        .eq('month', new Date().toISOString().slice(0, 7))

      if (budgetError) throw budgetError

      // Lấy chi tiêu cho mỗi danh mục
      const { data: transactionData, error: transError } = await supabase
        .from('transactions')
        .select('amount, category_id')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', new Date().toISOString().slice(0, 7))
        .lte('date', new Date().toISOString().slice(0, 7) + '-31')

      if (transError) throw transError

      // Tính tổng chi tiêu cho mỗi danh mục
      const spentByCategory = {}
      transactionData?.forEach(trans => {
        spentByCategory[trans.category_id] = (spentByCategory[trans.category_id] || 0) + Number(trans.amount)
      })

      // Kết hợp dữ liệu
      const formattedBudgets = budgetData?.map(budget => ({
        id: budget.id,
        category: budget.categories.name,
        limit: budget.amount,
        spent: spentByCategory[budget.categories.id] || 0,
        color: budget.categories.color
      })) || []

      setBudgets(formattedBudgets)
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu ngân sách:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.limit) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!')
      return
    }
    
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', newBudget.category)
        .eq('user_id', user.id)
        .single()

      if (categoryError) throw categoryError

      const { data, error } = await supabase
        .from('budgets')
        .insert({
          category_id: categoryData.id,
          user_id: user.id,
          amount: parseFloat(newBudget.limit),
          month: new Date().toISOString().slice(0, 7)
        })

      if (error) throw error

      fetchBudgets()
      setNewBudget({
        category: '',
        limit: '',
        spent: 0,
        color: 'from-blue-500 to-cyan-400'
      })
      setShowAddModal(false)
    } catch (error) {
      console.error('Lỗi khi thêm ngân sách:', error)
      alert('Có lỗi xảy ra khi thêm ngân sách!')
    }
  }
  
  const handleDeleteBudget = async (id) => {
    if (confirm('Bạn có chắc muốn xóa ngân sách này?')) {
      try {
        const { error } = await supabase
          .from('budgets')
          .delete()
          .eq('id', id)

        if (error) throw error

        fetchBudgets()
      } catch (error) {
        console.error('Lỗi khi xóa ngân sách:', error)
        alert('Có lỗi xảy ra khi xóa ngân sách!')
      }
    }
  }
  
  const calculatePercentage = (spent, limit) => {
    return Math.min(Math.round((spent / limit) * 100), 100)
  }
  
  const getStatusColor = (spent, limit) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-orange-500'
    return 'text-green-600'
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
        <h1 className="text-2xl font-bold text-gray-800">Quản lý ngân sách</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 rounded-lg gradient-bg text-white font-medium"
        >
          <FiPlus className="mr-2" />
          Thêm ngân sách
        </button>
      </div>
      
      {/* Tổng quan ngân sách */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Tổng quan ngân sách tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Tổng ngân sách</h3>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(budgets.reduce((sum, budget) => sum + budget.limit, 0))}
            </p>
          </div>
          
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Đã chi tiêu</h3>
            <p className="text-2xl font-bold mt-2 text-primary-600">
              {formatCurrency(budgets.reduce((sum, budget) => sum + budget.spent, 0))}
            </p>
          </div>
          
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Còn lại</h3>
            <p className="text-2xl font-bold mt-2 text-secondary-600">
              {formatCurrency(
                budgets.reduce((sum, budget) => sum + budget.limit, 0) - 
                budgets.reduce((sum, budget) => sum + budget.spent, 0)
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* Danh sách ngân sách */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length > 0 ? (
          budgets.map((budget) => {
            const percentage = calculatePercentage(budget.spent, budget.limit)
            const statusColor = getStatusColor(budget.spent, budget.limit)
            
            return (
              <div key={budget.id} className="glass-card p-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{budget.category}</h3>
                  <div className="flex space-x-2">
                    <button className="text-primary-600 hover:text-primary-800">
                      <FiEdit2 />
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 mb-2 flex justify-between">
                  <span className={`font-medium ${statusColor}`}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                  </span>
                  <span className={`font-medium ${statusColor}`}>{percentage}%</span>
                </div>
                
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${budget.color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="mt-4">
                  {percentage >= 100 ? (
                    <p className="text-red-600 text-sm">Đã vượt ngân sách!</p>
                  ) : percentage >= 80 ? (
                    <p className="text-orange-500 text-sm">Sắp vượt ngân sách!</p>
                  ) : (
                    <p className="text-green-600 text-sm">Trong ngân sách</p>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-3 text-center py-8 glass-card">
            <p className="text-gray-500">Chưa có ngân sách nào được thiết lập</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-2 gradient-bg text-white rounded-lg"
            >
              Thêm ngân sách đầu tiên
            </button>
          </div>
        )}
      </div>
      
      {/* Modal thêm ngân sách */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Thêm ngân sách mới</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  placeholder="Ví dụ: Ăn uống, Đi lại, Mua sắm..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn mức</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={displayLimit}
                  onChange={handleLimitChange}
                  placeholder="Nhập số tiền"
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
                onClick={handleAddBudget}
              >
                Thêm ngân sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budget
