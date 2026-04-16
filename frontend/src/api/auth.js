import apiClient from './client'

// Временные данные для заглушки (пока нет бэкенда)
const MOCK_USER = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Тестовый',
  last_name: 'Пользователь',
  role: 'client',
  created_at: new Date().toISOString(),
}

/**
 * Регистрация нового пользователя
 * @param {Object} userData - данные пользователя
 * @param {string} userData.email - email
 * @param {string} userData.password - пароль
 * @param {string} userData.passwordConfirmation - подтверждение пароля
 * @param {string} userData.firstName - имя (опционально)
 * @param {string} userData.lastName - фамилия (опционально)
 */
export const register = async (userData) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.post('/auth/register/', {
    //   email: userData.email,
    //   password: userData.password,
    //   password_confirmation: userData.passwordConfirmation || userData.password,
    //   first_name: userData.firstName || '',
    //   last_name: userData.lastName || '',
    //   role: 'client',
    // })
    // return response.data
    
    // Временная заглушка
    console.log('Регистрация (заглушка):', userData)
    
    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Проверяем совпадение паролей
    if (userData.password !== userData.passwordConfirmation) {
      throw { message: 'Пароли не совпадают' }
    }
    
    // Имитируем успешную регистрацию
    return {
      access_token: 'mock_token_' + Date.now(),
      user: {
        ...MOCK_USER,
        email: userData.email,
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
      }
    }
  } catch (error) {
    // throw error.response?.data || { message: 'Ошибка регистрации' }
    console.error('Ошибка регистрации:', error)
    throw error
  }
}

/**
 * Вход в систему
 * @param {string} email - email пользователя
 * @param {string} password - пароль
 */
export const login = async (email, password) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.post('/auth/login/', {
    //   email,
    //   password,
    // })
    // 
    // // Сохраняем токен в localStorage
    // if (response.data.access_token) {
    //   localStorage.setItem('access_token', response.data.access_token)
    //   localStorage.setItem('user', JSON.stringify(response.data.user))
    // }
    // 
    // return response.data
    
    // Временная заглушка
    console.log('Вход (заглушка):', email, password)
    
    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Простая валидация для демо
    if (!email || !password) {
      throw { message: 'Email и пароль обязательны' }
    }
    
    // Для демо подойдёт любой email с паролем не менее 6 символов
    if (password.length < 6) {
      throw { message: 'Неверный email или пароль' }
    }
    
    const mockToken = 'mock_token_' + Date.now()
    const mockUser = {
      ...MOCK_USER,
      email: email,
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('access_token', mockToken)
    localStorage.setItem('user', JSON.stringify(mockUser))
    
    return {
      access_token: mockToken,
      user: mockUser
    }
  } catch (error) {
    // throw error.response?.data || { message: 'Ошибка входа' }
    console.error('Ошибка входа:', error)
    throw error
  }
}

/**
 * Выход из системы
 */
export const logout = async () => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // await apiClient.post('/auth/logout/')
    
    // Временная заглушка
    console.log('Выход (заглушка)')
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error('Ошибка при выходе:', error)
  } finally {
    // В любом случае очищаем локальные данные
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }
}

/**
 * Получение текущего пользователя
 */
export const getCurrentUser = async () => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.get('/auth/me/')
    // return response.data
    
    // Временная заглушка
    console.log('Получение текущего пользователя (заглушка)')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      return JSON.parse(storedUser)
    }
    
    throw { message: 'Пользователь не найден' }
  } catch (error) {
    // throw error.response?.data || { message: 'Ошибка получения данных пользователя' }
    console.error('Ошибка получения данных пользователя:', error)
    throw error
  }
}

/**
 * Обновление данных пользователя
 * @param {Object} userData - данные для обновления
 */
export const updateUser = async (userData) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.patch('/auth/me/', userData)
    // // Обновляем данные в localStorage
    // localStorage.setItem('user', JSON.stringify(response.data))
    // return response.data
    
    // Временная заглушка
    console.log('Обновление пользователя (заглушка):', userData)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const storedUser = localStorage.getItem('user')
    const currentUser = storedUser ? JSON.parse(storedUser) : MOCK_USER
    
    const updatedUser = {
      ...currentUser,
      ...userData,
    }
    
    localStorage.setItem('user', JSON.stringify(updatedUser))
    return updatedUser
  } catch (error) {
    // throw error.response?.data || { message: 'Ошибка обновления данных' }
    console.error('Ошибка обновления данных:', error)
    throw error
  }
}

/**
 * Смена пароля
 * @param {string} oldPassword - старый пароль
 * @param {string} newPassword - новый пароль
 */
export const changePassword = async (oldPassword, newPassword) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.post('/auth/change-password/', {
    //   old_password: oldPassword,
    //   new_password: newPassword,
    // })
    // return response.data
    
    // Временная заглушка
    console.log('Смена пароля (заглушка)')
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (!oldPassword || !newPassword) {
      throw { message: 'Заполните все поля' }
    }
    
    if (newPassword.length < 6) {
      throw { message: 'Новый пароль должен содержать минимум 6 символов' }
    }
    
    return { message: 'Пароль успешно изменён' }
  } catch (error) {
    // throw error.response?.data || { message: 'Ошибка смены пароля' }
    console.error('Ошибка смены пароля:', error)
    throw error
  }
}

/**
 * Удаление аккаунта
 */
export const deleteAccount = async () => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.delete('/auth/me/')
    // return response.data
    
    // Временная заглушка
    console.log('Удаление аккаунта (заглушка)')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Очищаем localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    
    return { message: 'Аккаунт успешно удалён' }
  } catch (error) {
    // throw error.response?.data || { message: 'Ошибка удаления аккаунта' }
    console.error('Ошибка удаления аккаунта:', error)
    throw error
  }
}