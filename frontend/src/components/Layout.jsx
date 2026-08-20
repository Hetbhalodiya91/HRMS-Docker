import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationAPI } from '../services/api'
import {
  LayoutDashboard, CalendarPlus, CalendarDays, Users, Building2,
  Bell, LogOut, Menu, X, ChevronRight, CheckSquare
} from 'lucide-react'

export default function Layout() {
  const { user, logout, isAdmin, isManager } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    notificationAPI.getUnreadCount()
      .then(res => setUnreadCount(res.data.data))
      .catch(() => {})
    const interval = setInterval(() => {
      notificationAPI.getUnreadCount()
        .then(res => setUnreadCount(res.data.data))
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { path: '/apply-leave', icon: CalendarPlus, label: 'Apply Leave', show: true },
    { path: '/my-leaves', icon: CalendarDays, label: 'My Leaves', show: true },
    { path: '/manage-leaves', icon: CheckSquare, label: 'Manage Leaves', show: isManager() },
    { path: '/admin/users', icon: Users, label: 'Users', show: isAdmin() },
    { path: '/admin/departments', icon: Building2, label: 'Departments', show: isAdmin() },
  ].filter(item => item.show)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-primary-800 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-4 border-b border-primary-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            <div>
              <h1 className="font-bold text-sm">HRMS</h1>
              <p className="text-xs text-primary-300">Enterprise System</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-primary-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {user?.roles?.map(role => (
                  <span key={role} className="text-xs bg-primary-700 px-1.5 py-0.5 rounded text-primary-200">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive(path)
                  ? 'bg-white text-primary-800'
                  : 'text-primary-100 hover:bg-primary-700'}`}>
              <Icon size={18} />
              {label}
              {isActive(path) && <ChevronRight size={16} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-primary-700">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-primary-100 hover:bg-primary-700 transition-colors">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1">
            <Menu size={22} />
          </button>
          <div className="hidden lg:block text-sm text-gray-500">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="text-sm font-medium text-gray-700 hidden sm:block">
              {user?.name}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
