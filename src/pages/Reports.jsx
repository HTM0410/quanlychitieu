import { useState, useEffect } from 'react'
import { FiDownload, FiCalendar } from 'react-icons/fi'
import { Pie, Line, Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js'
import { supabase } from '../supabase/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Đăng ký các thành phần Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement)

const Reports = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState({
    income: 0,
    expense: 0,
    categories: []
  })
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    if (user) {
      fetchMonthlyData()
    }
  }, [user, selectedMonth])

  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      const start = startOfMonth(new Date(selectedMonth))
      const end = endOfMonth(new Date(selectedMonth))

      // Lấy tất cả giao dịch trong tháng
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          type,
          categories (
            name,
            color
          )
        `)
        .eq('user_id', user.id)
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())

      if (error) throw error

      // Tính toán tổng thu nhập và chi tiêu
      const income = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      const expense = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      // Tính toán chi tiêu theo danh mục
      const categoryData = {}
      transactions
        ?.filter(t => t.type === 'expense')
        .forEach(transaction => {
          const categoryName = transaction.categories?.name
          if (categoryName) {
            if (!categoryData[categoryName]) {
              categoryData[categoryName] = {
                amount: 0,
                color: transaction.categories.color
              }
            }
            categoryData[categoryName].amount += Number(transaction.amount)
          }
        })

      const categories = Object.entries(categoryData).map(([name, data]) => ({
        name,
        amount: data.amount,
        color: data.color
      }))

      setMonthlyData({
        income,
        expense,
        categories
      })
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu báo cáo:', error)
    } finally {
      setLoading(false)
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

  // Dữ liệu cho biểu đồ tròn
  const doughnutData = {
    labels: monthlyData.categories.map(c => c.name),
    datasets: [
      {
        data: monthlyData.categories.map(c => c.amount),
        backgroundColor: monthlyData.categories.map(c => c.color.split(' ')[0].replace('from-', '')),
        borderWidth: 0,
      },
    ],
  }

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Chi tiêu theo danh mục',
      },
    },
  }

  // Dữ liệu cho biểu đồ cột
  const barData = {
    labels: ['Thu nhập', 'Chi tiêu'],
    datasets: [
      {
        data: [monthlyData.income, monthlyData.expense],
        backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
        borderRadius: 8,
      },
    ],
  }

  const barOptions = {
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Tổng quan thu chi',
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
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo tài chính</h1>
        <div className="flex space-x-4">
          <div className="glass-card p-2 flex items-center">
            <FiCalendar className="mr-2 text-gray-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-gray-700"
            />
          </div>
          <button className="flex items-center px-4 py-2 rounded-lg bg-primary-500 text-white">
            <FiDownload className="mr-2" />
            Xuất báo cáo
          </button>
        </div>
      </div>
      
      {/* Tổng quan */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Tổng quan tài chính tháng 7/2023</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Thu nhập</h3>
            <p className="text-2xl font-bold mt-2 text-green-600">{formatCurrency(monthlyData.income)}</p>
          </div>
          
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Chi tiêu</h3>
            <p className="text-2xl font-bold mt-2 text-red-500">{formatCurrency(monthlyData.expense)}</p>
          </div>
          
          <div className="bg-white/30 p-4 rounded-xl">
            <h3 className="font-medium">Chênh lệch</h3>
            <p className={`text-2xl font-bold mt-2 ${monthlyData.income - monthlyData.expense >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(monthlyData.income - monthlyData.expense)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <Bar data={barData} options={barOptions} />
        </div>
        
        <div className="glass-card p-6">
          {monthlyData.categories.length > 0 ? (
            <Doughnut data={doughnutData} options={doughnutOptions} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Chưa có dữ liệu chi tiêu trong tháng này</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Chi tiết theo danh mục */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Chi tiết theo danh mục</h2>
        
        {monthlyData.categories.length > 0 ? (
          <div className="space-y-4">
            {monthlyData.categories.map((category, index) => {
              const percentage = Math.round((category.amount / monthlyData.expense) * 100)
              return (
                <div key={index} className="p-4 bg-white/30 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{category.name}</h3>
                    <span className="font-medium">{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${category.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{percentage}% tổng chi tiêu</p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Chưa có dữ liệu chi tiêu trong tháng này</p>
        )}
      </div>
    </div>
  )
}

export default Reports
