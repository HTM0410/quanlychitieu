import { useState, useEffect } from 'react'
import { FiUser, FiLock, FiDollarSign, FiBell, FiGlobe, FiSave, FiPlus, FiEdit2, FiTrash2, FiList } from 'react-icons/fi'
import { supabase } from '../supabase/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const Settings = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense',
    color: 'bg-blue-500'
  })
  const [profile, setProfile] = useState({
    fullName: 'Trương Minh Hoàng',
    email: 'nguyenthanh@gmail.com',
    phone: '0912345678',
    avatar: ''
  })
  
  const [currency, setCurrency] = useState('VND')
  const [language, setLanguage] = useState('vi')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weeklyReport: true,
    budgetAlert: true,
    tips: false
  })
  
  useEffect(() => {
    if (user) {
      fetchCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Lỗi khi lấy danh mục:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    try {
      if (!newCategory.name) {
        alert('Vui lòng nhập tên danh mục!')
        return
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name,
          type: newCategory.type,
          color: newCategory.color,
          user_id: user.id
        })
        .select()

      if (error) throw error

      setCategories([...categories, data[0]])
      setShowAddCategoryModal(false)
      setNewCategory({
        name: '',
        type: 'expense',
        color: 'bg-blue-500'
      })
    } catch (error) {
      console.error('Lỗi khi thêm danh mục:', error)
      alert('Có lỗi xảy ra khi thêm danh mục!')
    }
  }

  const handleEditCategory = async () => {
    try {
      if (!editingCategory.name) {
        alert('Vui lòng nhập tên danh mục!')
        return
      }

      const { data, error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name,
          type: editingCategory.type,
          color: editingCategory.color
        })
        .eq('id', editingCategory.id)
        .select()

      if (error) throw error

      setCategories(categories.map(c => 
        c.id === editingCategory.id ? data[0] : c
      ))
      setEditingCategory(null)
    } catch (error) {
      console.error('Lỗi khi cập nhật danh mục:', error)
      alert('Có lỗi xảy ra khi cập nhật danh mục!')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (confirm('Bạn có chắc muốn xóa danh mục này? Các giao dịch liên quan sẽ bị ảnh hưởng!')) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)

        if (error) throw error

        setCategories(categories.filter(c => c.id !== id))
      } catch (error) {
        console.error('Lỗi khi xóa danh mục:', error)
        alert('Có lỗi xảy ra khi xóa danh mục!')
      }
    }
  }

  const handleCreateDefaultCategories = async () => {
    try {
      const defaultCategories = [
        // Chi tiêu
        { name: 'Ăn uống', type: 'expense', color: 'bg-red-500' },
        { name: 'Di chuyển', type: 'expense', color: 'bg-blue-500' },
        { name: 'Mua sắm', type: 'expense', color: 'bg-purple-500' },
        { name: 'Hóa đơn & Tiện ích', type: 'expense', color: 'bg-yellow-500' },
        { name: 'Giải trí', type: 'expense', color: 'bg-green-500' },
        { name: 'Sức khỏe', type: 'expense', color: 'bg-pink-500' },
        { name: 'Giáo dục', type: 'expense', color: 'bg-indigo-500' },
        { name: 'Khác', type: 'expense', color: 'bg-gray-500' },
        // Thu nhập
        { name: 'Lương', type: 'income', color: 'bg-emerald-500' },
        { name: 'Thưởng', type: 'income', color: 'bg-amber-500' },
        { name: 'Đầu tư', type: 'income', color: 'bg-cyan-500' },
        { name: 'Được tặng', type: 'income', color: 'bg-lime-500' },
        { name: 'Thu nhập phụ', type: 'income', color: 'bg-orange-500' },
        { name: 'Khác', type: 'income', color: 'bg-slate-500' }
      ]

      const { error } = await supabase
        .from('categories')
        .insert(defaultCategories.map(cat => ({
          ...cat,
          user_id: user.id
        })))

      if (error) throw error

      fetchCategories()
      alert('Đã tạo danh mục mặc định thành công!')
    } catch (error) {
      console.error('Lỗi khi tạo danh mục mặc định:', error)
      alert('Có lỗi xảy ra khi tạo danh mục mặc định!')
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfile({
      ...profile,
      [name]: value
    })
  }
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target
    setNotifications({
      ...notifications,
      [name]: checked
    })
  }
  
  const handleSaveProfile = (e) => {
    e.preventDefault()
    // Xử lý lưu thông tin hồ sơ
    alert('Đã lưu thông tin hồ sơ thành công!')
  }
  
  const handleSavePreferences = (e) => {
    e.preventDefault()
    // Xử lý lưu tùy chọn
    alert('Đã lưu tùy chọn thành công!')
  }
  
  const handleSaveNotifications = (e) => {
    e.preventDefault()
    // Xử lý lưu thông báo
    alert('Đã lưu cài đặt thông báo thành công!')
  }
  
  const handleChangePassword = (e) => {
    e.preventDefault()
    // Xử lý đổi mật khẩu
    alert('Đã đổi mật khẩu thành công!')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Cài đặt tài khoản</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Thanh tab */}
        <div className="md:w-64 glass-card p-4">
          <ul className="space-y-2">
            <li>
              <button 
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-white/30 text-primary-700 font-medium' 
                    : 'hover:bg-white/20 text-gray-700'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <FiUser className="mr-3" />
                Hồ sơ cá nhân
              </button>
            </li>
            <li>
              <button 
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'security' 
                    ? 'bg-white/30 text-primary-700 font-medium' 
                    : 'hover:bg-white/20 text-gray-700'
                }`}
                onClick={() => setActiveTab('security')}
              >
                <FiLock className="mr-3" />
                Bảo mật
              </button>
            </li>
            <li>
              <button 
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'preferences' 
                    ? 'bg-white/30 text-primary-700 font-medium' 
                    : 'hover:bg-white/20 text-gray-700'
                }`}
                onClick={() => setActiveTab('preferences')}
              >
                <FiDollarSign className="mr-3" />
                Tùy chọn
              </button>
            </li>
            <li>
              <button 
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'notifications' 
                    ? 'bg-white/30 text-primary-700 font-medium' 
                    : 'hover:bg-white/20 text-gray-700'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <FiBell className="mr-3" />
                Thông báo
              </button>
            </li>
            <li>
              <button 
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'categories' 
                    ? 'bg-white/30 text-primary-700 font-medium' 
                    : 'hover:bg-white/20 text-gray-700'
                }`}
                onClick={() => setActiveTab('categories')}
              >
                <FiList className="mr-3" />
                Danh mục
              </button>
            </li>
          </ul>
        </div>
        
        {/* Nội dung tab */}
        <div className="flex-1 glass-card p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Hồ sơ cá nhân</h2>
              
              <form onSubmit={handleSaveProfile}>
                <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white text-3xl font-medium">
                    {profile.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg">{profile.fullName}</h3>
                    <p className="text-gray-600">{profile.email}</p>
                    <button className="mt-2 px-3 py-1 text-sm border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50">
                      Thay đổi ảnh đại diện
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input 
                      type="text" 
                      name="fullName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={profile.fullName}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={profile.email}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input 
                      type="tel" 
                      name="phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={profile.phone}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    type="submit"
                    className="flex items-center px-4 py-2 gradient-bg text-white rounded-lg"
                  >
                    <FiSave className="mr-2" />
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Bảo mật</h2>
              
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <button 
                    type="submit"
                    className="flex items-center px-4 py-2 gradient-bg text-white rounded-lg"
                  >
                    <FiSave className="mr-2" />
                    Đổi mật khẩu
                  </button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-medium mb-4">Xác thực hai yếu tố</h3>
                  <p className="text-gray-600 mb-4">Bảo vệ tài khoản của bạn bằng xác thực hai yếu tố.</p>
                  
                  <button className="px-4 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50">
                    Thiết lập xác thực hai yếu tố
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Tùy chọn</h2>
              
              <form onSubmit={handleSavePreferences}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tiền tệ</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="VND">Việt Nam Đồng (VND)</option>
                      <option value="USD">Đô la Mỹ (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="JPY">Yên Nhật (JPY)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">Tiếng Anh</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu tháng tài chính</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="1">Ngày 1 hàng tháng</option>
                      <option value="15">Ngày 15 hàng tháng</option>
                      <option value="25">Ngày 25 hàng tháng</option>
                      <option value="custom">Tùy chỉnh</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Định dạng ngày</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                      <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                      <option value="yyyy/mm/dd">YYYY/MM/DD</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    type="submit"
                    className="flex items-center px-4 py-2 gradient-bg text-white rounded-lg"
                  >
                    <FiSave className="mr-2" />
                    Lưu tùy chọn
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Thông báo</h2>
              
              <form onSubmit={handleSaveNotifications}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 hover:bg-white/20 rounded-lg">
                    <div>
                      <h3 className="font-medium">Thông báo qua email</h3>
                      <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        name="email"
                        checked={notifications.email}
                        onChange={handleNotificationChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 hover:bg-white/20 rounded-lg">
                    <div>
                      <h3 className="font-medium">Thông báo đẩy</h3>
                      <p className="text-sm text-gray-600">Nhận thông báo trên trình duyệt</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        name="push"
                        checked={notifications.push}
                        onChange={handleNotificationChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 hover:bg-white/20 rounded-lg">
                    <div>
                      <h3 className="font-medium">Báo cáo hàng tuần</h3>
                      <p className="text-sm text-gray-600">Nhận báo cáo tổng hợp hàng tuần</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        name="weeklyReport"
                        checked={notifications.weeklyReport}
                        onChange={handleNotificationChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 hover:bg-white/20 rounded-lg">
                    <div>
                      <h3 className="font-medium">Cảnh báo ngân sách</h3>
                      <p className="text-sm text-gray-600">Thông báo khi chi tiêu vượt ngân sách</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        name="budgetAlert"
                        checked={notifications.budgetAlert}
                        onChange={handleNotificationChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 hover:bg-white/20 rounded-lg">
                    <div>
                      <h3 className="font-medium">Mẹo tiết kiệm</h3>
                      <p className="text-sm text-gray-600">Nhận các mẹo tiết kiệm định kỳ</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        name="tips"
                        checked={notifications.tips}
                        onChange={handleNotificationChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    type="submit"
                    className="flex items-center px-4 py-2 gradient-bg text-white rounded-lg"
                  >
                    <FiSave className="mr-2" />
                    Lưu cài đặt
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Quản lý danh mục</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCreateDefaultCategories}
                    className="px-4 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50"
                  >
                    Tạo danh mục mặc định
                  </button>
                  <button 
                    onClick={() => setShowAddCategoryModal(true)}
                    className="flex items-center px-4 py-2 gradient-bg text-white rounded-lg"
                  >
                    <FiPlus className="mr-2" />
                    Thêm danh mục
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Chi tiêu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories
                        .filter(cat => cat.type === 'expense')
                        .map(category => (
                          <div key={category.id} className="bg-white/30 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full ${category.color} mr-3`}></div>
                              <span>{category.name}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setEditingCategory(category)}
                                className="p-1.5 hover:bg-white/20 rounded-lg"
                              >
                                <FiEdit2 className="text-primary-600" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(category.id)}
                                className="p-1.5 hover:bg-white/20 rounded-lg"
                              >
                                <FiTrash2 className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Thu nhập</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories
                        .filter(cat => cat.type === 'income')
                        .map(category => (
                          <div key={category.id} className="bg-white/30 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full ${category.color} mr-3`}></div>
                              <span>{category.name}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setEditingCategory(category)}
                                className="p-1.5 hover:bg-white/20 rounded-lg"
                              >
                                <FiEdit2 className="text-primary-600" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(category.id)}
                                className="p-1.5 hover:bg-white/20 rounded-lg"
                              >
                                <FiTrash2 className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal thêm danh mục */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Thêm danh mục mới</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="Nhập tên danh mục"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại danh mục</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary-600"
                      checked={newCategory.type === 'expense'}
                      onChange={() => setNewCategory({...newCategory, type: 'expense'})}
                    />
                    <span className="ml-2">Chi tiêu</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary-600"
                      checked={newCategory.type === 'income'}
                      onChange={() => setNewCategory({...newCategory, type: 'income'})}
                    />
                    <span className="ml-2">Thu nhập</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                >
                  <option value="bg-red-500">Đỏ</option>
                  <option value="bg-blue-500">Xanh dương</option>
                  <option value="bg-green-500">Xanh lá</option>
                  <option value="bg-yellow-500">Vàng</option>
                  <option value="bg-purple-500">Tím</option>
                  <option value="bg-pink-500">Hồng</option>
                  <option value="bg-indigo-500">Chàm</option>
                  <option value="bg-gray-500">Xám</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                onClick={() => setShowAddCategoryModal(false)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 gradient-bg text-white rounded-lg"
                onClick={handleAddCategory}
              >
                Thêm danh mục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa danh mục */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa danh mục</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại danh mục</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary-600"
                      checked={editingCategory.type === 'expense'}
                      onChange={() => setEditingCategory({...editingCategory, type: 'expense'})}
                    />
                    <span className="ml-2">Chi tiêu</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary-600"
                      checked={editingCategory.type === 'income'}
                      onChange={() => setEditingCategory({...editingCategory, type: 'income'})}
                    />
                    <span className="ml-2">Thu nhập</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingCategory.color}
                  onChange={(e) => setEditingCategory({...editingCategory, color: e.target.value})}
                >
                  <option value="bg-red-500">Đỏ</option>
                  <option value="bg-blue-500">Xanh dương</option>
                  <option value="bg-green-500">Xanh lá</option>
                  <option value="bg-yellow-500">Vàng</option>
                  <option value="bg-purple-500">Tím</option>
                  <option value="bg-pink-500">Hồng</option>
                  <option value="bg-indigo-500">Chàm</option>
                  <option value="bg-gray-500">Xám</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                onClick={() => setEditingCategory(null)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 gradient-bg text-white rounded-lg"
                onClick={handleEditCategory}
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

export default Settings
