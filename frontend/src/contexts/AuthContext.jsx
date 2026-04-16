import { createContext, useState, useEffect, useCallback } from 'react'
import { login as loginApi, register as registerApi, logout as logoutApi, getCurrentUser, updateUser as updateUserApi } from '../api/auth'

// Создаём контекст
export const AuthContext = createContext(null)

// Провайдер контекста - оборачивает всё приложение
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [isAuthenticated, setIsAuthenticated] = useState(!!token)
  const [loading, setLoading] = useState(true) // Начальная загрузка пользователя

  // Загрузка пользователя из localStorage при старте
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('access_token')
      
      if (storedToken && storedUser) {
        try {
          // Пробуем получить актуальные данные с сервера
          const userData = await getCurrentUser()
          setUser(userData)
          setToken(storedToken)
          setIsAuthenticated(true)
        } catch (error) {
          // Если ошибка - чистим данные
          console.error('Ошибка загрузки пользователя:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          setUser(null)
          setToken(null)
          setIsAuthenticated(false)
        }
      }
      setLoading(false)
    }
    
    loadUser()
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const data = await loginApi(email, password)
      setUser(data.user)
      setToken(data.access_token)
      setIsAuthenticated(true)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.detail || 'Ошибка входа' }
    }
  }, [])

  const register = useCallback(async (userData) => {
    try {
      const data = await registerApi(userData)
      // После регистрации сразу логиним пользователя
      const loginResult = await loginApi(userData.email, userData.password)
      setUser(loginResult.user)
      setToken(loginResult.access_token)
      setIsAuthenticated(true)
      return { success: true, data: loginResult }
    } catch (error) {
      return { success: false, error: error.detail || 'Ошибка регистрации' }
    }
  }, [login])

  // Функция выхода
  const logout = useCallback(async () => {
    await logoutApi()
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
  }, [])

  const updateUser = useCallback(async (userData) => {
    try {
      const updatedUser = await updateUserApi(userData)
      setUser(updatedUser)
      return { success: true, data: updatedUser }
    } catch (error) {
      return { success: false, error: error.detail || 'Ошибка обновления данных' }
    }
  }, [])

  // Значения, которые будут доступны через useContext
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}