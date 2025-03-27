import { useState, useEffect } from 'react'
import { FiArrowUp, FiArrowDown, FiDollarSign, FiCreditCard, FiPieChart } from 'react-icons/fi'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { supabase } from '../supabase/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Đăng ký các thành phần Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [totalBalance, setTotalBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [savings, setSavings] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [financialGoals, setFinancialGoals] = useState([])
  const [weeklyData, setWeeklyData] = useState({
    income: Array(7).fill(0),
    expense: Array(7).fill(0)
  })
  
  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Lỗi khi lấy thông tin profile:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Lấy tất cả giao dịch trong tuần này
      const startDate = startOfWeek(new Date(), { weekStartsOn: 1 })
      const endDate = endOfWeek(new Date(), { weekStartsOn: 1 })
      
      const { data: weekTransactions, error: weekError } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true })

      if (weekTransactions) {
        const weekDays = eachDayOfInterval({ start: startDate, end: endDate })
        const newWeeklyData = {
          income: Array(7).fill(0),
          expense: Array(7).fill(0)
        }

        weekTransactions.forEach(transaction => {
          const dayIndex = weekDays.findIndex(day => 
            format(new Date(transaction.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          )
          if (dayIndex !== -1) {
            if (transaction.type === 'income') {
              newWeeklyData.income[dayIndex] += Number(transaction.amount)
            } else {
              newWeeklyData.expense[dayIndex] += Number(transaction.amount)
            }
          }
        })

        setWeeklyData(newWeeklyData)
      }

      // Lấy tổng thu nhập và chi tiêu của tất cả thời gian
      const { data: allTransactions, error: transError } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)

      if (allTransactions) {
        const totalIncome = allTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        
        const totalExpense = allTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        setIncome(totalIncome)
        setExpenses(totalExpense)
        setTotalBalance(totalIncome - totalExpense)
        setSavings(0)
      }

      // Lấy giao dịch gần đây
      const { data: recentTrans } = await supabase
        .from('transactions')
        .select(`
          id,
          title,
          amount,
          type,
          date,
          categories (name)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5)

      setRecentTransactions(recentTrans || [])

      // Lấy mục tiêu tài chính
      const { data: goals } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)

      setFinancialGoals(goals || [])

    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Dữ liệu biểu đồ
  const chartData = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Thu nhập',
        data: weeklyData.income,
        backgroundColor: 'rgba(14, 165, 233, 0.7)',
        borderRadius: 8,
      },
      {
        label: 'Chi tiêu',
        data: weeklyData.expense,
        backgroundColor: 'rgba(217, 70, 239, 0.7)',
        borderRadius: 8,
      },
    ],
  }
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Thu chi trong tuần',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value)
          }
        }
      }
    }
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
      <h1 className="text-2xl font-bold text-gray-800">Xin chào, {profile?.full_name || 'User'}!</h1>
      
      {/* Thẻ tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Tổng số dư</p>
              <h3 className="text-xl font-bold mt-1">{formatCurrency(totalBalance)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
              <FiDollarSign size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Thu nhập</p>
              <h3 className="text-xl font-bold mt-1 text-green-600">{formatCurrency(income)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <FiArrowUp size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Chi tiêu</p>
              <h3 className="text-xl font-bold mt-1 text-red-500">{formatCurrency(expenses)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
              <FiArrowDown size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Tiết kiệm</p>
              <h3 className="text-xl font-bold mt-1 text-purple-600">{formatCurrency(savings)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <FiPieChart size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Biểu đồ và giao dịch gần đây */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Phân tích thu chi</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Giao dịch gần đây</h2>
            <button className="text-primary-600 text-sm font-medium">Xem tất cả</button>
          </div>
          
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center p-3 hover:bg-white/30 rounded-xl transition-colors">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                  }`}>
                    {transaction.type === 'income' ? <FiArrowUp /> : <FiArrowDown />}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="font-medium">{transaction.title}</h4>
                    <p className="text-xs text-gray-500">
                      {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: vi })} • {transaction.categories?.name}
                    </p>
                  </div>
                  <div className={`font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Chưa có giao dịch nào</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Mục tiêu tài chính */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Mục tiêu tài chính</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {financialGoals.length > 0 ? (
            financialGoals.map((goal) => {
              const progress = Math.round((goal.current_amount / goal.target_amount) * 100) || 0
              return (
                <div key={goal.id} className="bg-white/30 p-4 rounded-xl">
                  <h3 className="font-medium">{goal.title}</h3>
                  <div className="mt-2 mb-1 flex justify-between text-sm">
                    <span>Tiến độ: {progress}%</span>
                    <span>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full rounded-full gradient-bg" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-gray-500 col-span-3 text-center py-4">Chưa có mục tiêu tài chính nào</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
