import axios from 'axios'

// Базовый URL API (можно вынести в .env)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// Создаём инстанс axios с базовыми настройками
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд таймаут
})

// Перехватчик запросов - добавляем токен в заголовки
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Перехватчик ответов - обработка ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если 401 - не авторизован, удаляем токен и редиректим на логин
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      // Редирект на страницу логина, если мы не там уже
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    
    // Пробрасываем ошибку дальше для обработки в компонентах
    return Promise.reject(error)
  }
)

export default apiClient