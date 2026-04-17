import apiClient from './client'

/**
 * Регистрация нового пользователя
 * @param {Object} userData - данные пользователя
 * @param {string} userData.email - email
 * @param {string} userData.password - пароль
 * @param {string} userData.tg_username - Telegram юзернейм (опционально)
 */
export const register = async (userData) => {
  try {
    const payload = {
      email: userData.email,
      password: userData.password,
    }

    if (userData.tg_username && userData.tg_username.trim() !== '') {
      payload.tg_username = userData.tg_username.trim()
    }

    const response = await apiClient.post('/auth/register', payload)
    return {
      success: true,
      user: response.data
    }
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    throw error.response?.data || { detail: 'Ошибка регистрации' }
  }
}

/**
 * Вход в систему (FastAPI OAuth2PasswordRequestForm ожидает URL-encoded параметры username и password)
 * @param {string} email - email пользователя (используется как username)
 * @param {string} password - пароль
 */
export const login = async (email, password) => {
  try {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)

    const response = await apiClient.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    // Сохраняем токен в localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
    }

    // Получаем загруженный профиль
    const meResponse = await apiClient.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(meResponse.data))

    return {
      access_token: response.data.access_token,
      user: meResponse.data
    }
  } catch (error) {
    console.error('Ошибка входа:', error)
    throw error.response?.data || { detail: 'Ошибка входа' }
  }
}

/**
 * Выход из системы
 */
export const logout = async () => {
  try {
    // Если на бэкенде появится эндпоинт для логаута, раскомментируйте:
    // await apiClient.post('/auth/logout')
  } catch (error) {
    console.error('Ошибка при выходе:', error)
  } finally {
    // Удаляем токены и инфу пользователя
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }
}

/**
 * Получение текущего пользователя
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me')
    localStorage.setItem('user', JSON.stringify(response.data))
    return response.data
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error)
    throw error.response?.data || { detail: 'Пользователь не авторизован' }
  }
}

/**
 * Обновление данных пользователя
 * @param {Object} userData - данные для обновления
 */
export const updateUser = async (userData) => {
  try {
    const response = await apiClient.patch('/auth/me', userData)
    localStorage.setItem('user', JSON.stringify(response.data))
    return response.data
  } catch (error) {
    console.error('Ошибка обновления данных:', error)
    throw error.response?.data || { detail: 'Ошибка обновления данных' }
  }
}

// Заглушки для будущего (смена пароля и удаление)
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await apiClient.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка смены пароля:', error)
    throw error.response?.data || { detail: 'Ошибка смены пароля' }
  }
}

export const deleteAccount = async () => {
  try {
    const response = await apiClient.delete('/auth/me')
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    return response.data
  } catch (error) {
    console.error('Ошибка удаления аккаунта:', error)
    throw error.response?.data || { detail: 'Ошибка удаления аккаунта' }
  }
}