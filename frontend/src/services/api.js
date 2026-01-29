import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  googleLogin: () => api.get('/api/auth/google/login'),
  getMe: () => api.get('/api/auth/me'),
  setupMFA: () => api.post('/api/auth/mfa/setup'),
  enableMFA: (token) => api.post('/api/auth/mfa/enable', { token }),
  verifyMFA: (token) => api.post('/api/auth/mfa/verify', { token }),
  disableMFA: (token) => api.post('/api/auth/mfa/disable', { token }),
}

export const categoriesAPI = {
  getAll: () => api.get('/api/categories'),
  getById: (id) => api.get(`/api/categories/${id}`),
  getBySlug: (slug) => api.get(`/api/categories/slug/${slug}`),
}

export const contentAPI = {
  getAll: (categoryId = null) => {
    const params = categoryId ? { category_id: categoryId } : {}
    return api.get('/api/content', { params })
  },
  getById: (id) => api.get(`/api/content/${id}`),
  recordClick: (id) => api.post(`/api/content/${id}/click`),
  getClickStats: (id) => api.get(`/api/content/${id}/clicks`),
  getUserHistory: () => api.get('/api/content/user/history'),
}

export const groupsAPI = {
  getAll: () => api.get('/api/categories/groups/'),
}

export const adminAPI = {
  // Users
  getUsers: () => api.get('/api/admin/users'),
  toggleAdmin: (userId) => api.patch(`/api/admin/users/${userId}/admin`),
  toggleActive: (userId) => api.patch(`/api/admin/users/${userId}/active`),

  // Categories
  getCategories: () => api.get('/api/admin/categories'),
  createCategory: (data) => api.post('/api/admin/categories', data),
  updateCategory: (id, data) => api.patch(`/api/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/admin/categories/${id}`),
  reorderCategories: (orders) => api.post('/api/admin/categories/reorder', orders),
  toggleCategoryActive: (id) => api.patch(`/api/admin/categories/${id}/toggle-active`),

  // Content
  getContent: () => api.get('/api/admin/content'),
  createContent: (data) => api.post('/api/admin/content', data),
  updateContent: (id, data) => api.patch(`/api/admin/content/${id}`, data),
  deleteContent: (id) => api.delete(`/api/admin/content/${id}`),
  reorderContent: (orders) => api.post('/api/admin/content/reorder', orders),
  toggleContentActive: (id) => api.patch(`/api/admin/content/${id}/toggle-active`),

  // User History
  getHistoryStats: () => api.get('/api/admin/history/stats'),
  getUserHistory: (userId) => api.get(`/api/admin/users/${userId}/history`),

  // Category Groups
  getGroups: () => api.get('/api/admin/groups'),
  createGroup: (data) => api.post('/api/admin/groups', null, { params: data }),
  updateGroup: (id, data) => api.patch(`/api/admin/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/api/admin/groups/${id}`),
  toggleGroupActive: (id) => api.patch(`/api/admin/groups/${id}/toggle-active`),
  reorderGroups: (orders) => api.post('/api/admin/groups/reorder', orders),
}

export default api
