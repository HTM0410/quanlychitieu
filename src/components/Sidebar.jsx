import { NavLink } from 'react-router-dom'
import { FiHome, FiList, FiPieChart, FiBarChart2, FiSettings, FiCreditCard } from 'react-icons/fi'

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { path: '/', name: 'Tổng quan', icon: <FiHome /> },
    { path: '/transactions', name: 'Giao dịch', icon: <FiList /> },
    { path: '/budget', name: 'Ngân sách', icon: <FiPieChart /> },
    { path: '/debts', name: 'Vay nợ', icon: <FiCreditCard /> },
    { path: '/reports', name: 'Báo cáo', icon: <FiBarChart2 /> },
    { path: '/settings', name: 'Cài đặt', icon: <FiSettings /> }
  ]

  return (
    <aside className={`glass-card m-2 rounded-3xl flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-4 flex items-center justify-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
          {isOpen && (
            <h1 className="ml-3 text-xl font-bold gradient-text">QuanLyChiTieu</h1>
          )}
        </div>
      </div>
      
      <div className="flex-1 px-3 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-white/30 text-primary-700 font-medium' 
                      : 'hover:bg-white/20 text-gray-700'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                {isOpen && <span className="ml-3">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar