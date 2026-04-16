import apiClient from './client'

/**
 * Получение списка всех хабов
 */
export const getHubs = async (filters = {}) => {
  try {
    const response = await apiClient.get('/hubs/', { params: filters })
    return response.data
  } catch (error) {
    console.error('Ошибка получения хабов:', error)
    throw error.response?.data || error
  }
}

/**
 * Получение детальной информации о хабе по ID
 */
export const getHubById = async (id) => {
  try {
    const response = await apiClient.get(`/hubs/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка получения хаба:', error)
    throw error.response?.data || error
  }
}

/**
 * Создание нового хаба (только для ADMIN)
 */
export const createHub = async (hubData) => {
  try {
    const response = await apiClient.post('/hubs/', hubData)
    return response.data
  } catch (error) {
    console.error('Ошибка создания хаба:', error)
    throw error.response?.data || error
  }
}

/**
 * Обновление хаба (только для ADMIN)
 */
export const updateHub = async (id, hubData) => {
  try {
    const response = await apiClient.patch(`/hubs/${id}`, hubData)
    return response.data
  } catch (error) {
    console.error('Ошибка обновления хаба:', error)
    throw error.response?.data || error
  }
}

/**
 * Удаление хаба (только для ADMIN)
 */
export const deleteHub = async (id) => {
  try {
    const response = await apiClient.delete(`/hubs/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка удаления хаба:', error)
    throw error.response?.data || error
  }
}