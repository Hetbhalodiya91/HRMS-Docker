import { createContext, useContext, useState, useEffect } from 'react'
import { userAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      userAPI.getProfile()
        .then(res => setUser(res.data.data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (authData) => {
    localStorage.setItem('token', authData.token)
    setUser({
      id: authData.userId,
      name: authData.name,
      email: authData.email,
      roles: authData.roles,
      departmentName: authData.departmentName,
    })
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const hasRole = (role) => user?.roles?.includes(role)
  const isAdmin = () => hasRole('ADMIN')
  const isManager = () => hasRole('MANAGER') || hasRole('ADMIN')

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
