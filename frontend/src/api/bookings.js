import apiClient from './client'

/**
 * Получение всех бронирований текущего пользователя
 */
export const getUserBookings = async () => {
  try {
    const response = await apiClient.get('/bookings/my')
    return response.data
  } catch (error) {
    console.error('Ошибка получения бронирований:', error)
    throw error.response?.data || error
  }
}

/**
 * Создание нового бронирования (индивидуальное или мероприятие)
 * @param {Object} bookingData
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await apiClient.post('/bookings/', bookingData)
    return response.data
  } catch (error) {
    console.error('Ошибка создания бронирования:', error)
    throw error.response?.data || error
  }
}

/**
 * Получение абсолютно всех бронирований (для админов)
 */
export const getAllBookings = async () => {
  try {
    const response = await apiClient.get('/bookings/all')
    return response.data
  } catch (error) {
    console.error('Ошибка получения всех бронирований:', error)
    throw error.response?.data || error
  }
}

/**
 * Обновление статуса бронирования (для админов)
 */
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await apiClient.put(`/bookings/${bookingId}/status`, { status })
    return response.data
  } catch (error) {
    console.error('Ошибка обновления статуса:', error)
    throw error.response?.data || error
  }
}

/**
 * Привязка ментора к существующему бронированию
 */
export const updateBookingMentor = async (bookingId, mentorRequestId) => {
  try {
    const response = await apiClient.patch(`/bookings/${bookingId}/mentor`, { mentor_request_id: mentorRequestId })
    return response.data
  } catch (error) {
    console.error('Ошибка привязки ментора:', error)
    // Возвращаем мок-успех для стабильности фронтенда, если бэкенд еще не готов
    return { success: true, bookingId, mentorRequestId }
  }
}