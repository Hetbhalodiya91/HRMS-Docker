import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401
api.interceptors.response.use(
  res => res,
  err => {
    const isLoginPage = window.location.pathname === '/login'
    const hasToken = localStorage.getItem('token')

    const ignore401Urls = [
      '/notifications',
      '/leaves'
    ]

    console.log("API ERROR:", err.config?.url, err.response?.status)

    // 🔥 Ignore some APIs
    const shouldIgnore = ignore401Urls.some(url =>
      err.config?.url?.includes(url)
    )

    if (
      err.response?.status === 401 &&
      hasToken &&
      !isLoginPage &&
      !shouldIgnore
    ) {
      console.log("Unauthorized → logging out")

      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    return Promise.reject(err)
  }
)

export const authAPI = {
  register: data => api.post('/auth/register', data),
  login: data => api.post('/auth/login', data),
  verifyEmail: token => api.get(`/auth/verify-email?token=${token}`),
  forgotPassword: data => api.post('/auth/forgot-password', data),
  resetPassword: data => api.post('/auth/reset-password', data),
  getMe:           ()    => api.get('/users/me'),
}

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: id => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  disableUser: id => api.patch(`/users/${id}/disable`),
  enableUser: id => api.patch(`/users/${id}/enable`),
}

export const leaveAPI = {
  apply: data => api.post('/leaves/apply', data),
  getMyLeaves: (params) => api.get('/leaves/my', { params }),
  cancelLeave: id => api.patch(`/leaves/${id}/cancel`),
  getDepartmentLeaves: (params) => api.get('/leaves/department', { params }),
  reviewLeave: (id, data) => api.patch(`/leaves/${id}/review`, data),
  getAllLeaves: (params) => api.get('/leaves', { params }),
  getLeaveById: id => api.get(`/leaves/${id}`),
}

export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getById: id => api.get(`/departments/${id}`),
  create: data => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: id => api.delete(`/departments/${id}`),
}

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
}

export default api
