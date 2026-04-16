import apiClient from './client'

// Хранилище бронирований в памяти (заглушка)
let MOCK_BOOKINGS = []

/**
 * Получение всех бронирований пользователя
 */
export const getUserBookings = async () => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.get('/bookings/')
    // return response.data
    
    console.log('Получение бронирований пользователя (заглушка)')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return MOCK_BOOKINGS
  } catch (error) {
    console.error('Ошибка получения бронирований:', error)
    throw error
  }
}

/**
 * Создание нового бронирования
 */
export const createBooking = async (bookingData) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.post('/bookings/', bookingData)
    // return response.data
    
    console.log('Создание бронирования (заглушка):', bookingData)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const newBooking = {
      id: MOCK_BOOKINGS.length + 1,
      ...bookingData,
      createdAt: new Date().toISOString(),
      mentorshipRequestId: null,
      mentor: null
    }
    
    MOCK_BOOKINGS.push(newBooking)
    return newBooking
  } catch (error) {
    console.error('Ошибка создания бронирования:', error)
    throw error
  }
}

/**
 * Обновление бронирования (добавление ментора)
 */
export const updateBookingMentor = async (bookingId, mentorshipRequestId) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.patch(`/bookings/${bookingId}/`, { mentorship_request_id: mentorshipRequestId })
    // return response.data
    
    console.log('Обновление бронирования с ментором (заглушка):', bookingId, mentorshipRequestId)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const booking = MOCK_BOOKINGS.find(b => b.id === bookingId)
    if (booking) {
      booking.mentorshipRequestId = mentorshipRequestId
      booking.status = 'mentor_requested'
    }
    
    return booking
  } catch (error) {
    console.error('Ошибка обновления бронирования:', error)
    throw error
  }
}