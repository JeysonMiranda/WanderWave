const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Helper for standardized HTTP requests
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('wanderwave_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const config = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`
      const error = new Error(errorMsg)
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to the backend server. Please verify the server is running on http://localhost:5000.')
    }
    throw error
  }
}

// Authentication API services
export const authAPI = {
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request('/auth/me', {
      method: 'GET',
    }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetToken: (token) =>
    request(`/auth/verify-reset-token/${token}`, {
      method: 'GET',
    }),

  resetPassword: (token, password) =>
    request(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
}

// Destination API services
export const destinationsAPI = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val)
      }
    })
    const qs = searchParams.toString()
    return request(qs ? `/destinations?${qs}` : '/destinations', {
      method: 'GET',
    })
  },

  getById: (id) =>
    request(`/destinations/${id}`, {
      method: 'GET',
    }),

  create: (data) =>
    request('/destinations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/destinations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/destinations/${id}`, {
      method: 'DELETE',
    }),
}

// Bookings API services
export const bookingsAPI = {
  getMyBookings: () =>
    request('/bookings/my-bookings', {
      method: 'GET',
    }),

  create: (bookingData) =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  cancel: (id) =>
    request(`/bookings/${id}/cancel`, {
      method: 'PATCH',
    }),
}

// Admin management API services
export const adminAPI = {
  getStats: () =>
    request('/admin/stats', {
      method: 'GET',
    }),

  getUsers: () =>
    request('/admin/users', {
      method: 'GET',
    }),

  updateUser: (id, payload) =>
    request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getAllBookings: () =>
    request('/bookings/all', {
      method: 'GET',
    }),

  updateBookingStatus: (id, payload) =>
    request(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
}

// AI Travel Concierge Chat API service
export const chatAPI = {
  sendMessage: ({ message, conversationHistory = [], language = 'en' }) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory, language }),
    }),
}
