import { useState } from 'react'
import { FiMenu, FiBell, FiUser, FiSearch, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const Navbar = ({ toggleSidebar }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Lỗi đăng xuất:', error.message)
    }
  }

  return (
    <nav className="glass-nav sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <FiMenu className="text-primary-700 text-xl" />
        </button>
        <div className="ml-4 hidden md:block">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="pl-10 pr-4 py-2 rounded-full bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-500" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-white/20 transition-colors relative">
          <FiBell className="text-primary-700 text-xl" />
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-secondary-500 text-white text-xs flex items-center justify-center">
            3
          </span>
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <span className="hidden md:block text-gray-800 font-medium">
              {user?.email?.split('@')[0] || 'User'}
            </span>
          </button>
          
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 glass-card p-2 shadow-lg">
              <ul>
                <li className="px-3 py-2 hover:bg-white/30 rounded-lg cursor-pointer">Hồ sơ cá nhân</li>
                <li className="px-3 py-2 hover:bg-white/30 rounded-lg cursor-pointer">Cài đặt tài khoản</li>
                <li 
                  className="px-3 py-2 hover:bg-white/30 rounded-lg cursor-pointer text-red-500 flex items-center"
                  onClick={handleSignOut}
                >
                  <FiLogOut className="mr-2" />
                  Đăng xuất
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
