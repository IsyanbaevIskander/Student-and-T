import apiClient from './client'

/**
 * Получение списка менторов
 * @param {Object} filters - фильтры поиска
 */
export const getMentors = async (filters = {}) => {
  try {
    const response = await apiClient.get('/mentors/search', { params: filters })
    return response.data.mentors || []
  } catch (error) {
    console.error('Ошибка получения менторов:', error)
    return []
  }
}

/**
 * Получение ментора по ID
 */
export const getMentorById = async (id) => {
  try {
    const response = await apiClient.get(`/mentors/profile/${id}`)
    return response.data
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Ошибка получения ментора:', error)
    }
    throw error
  }
}

/**
 * Подать заявку на становление ментором
 * @param {Object} data - { hub_id, bio, skills }
 */
export const applyToBecomeMentor = async (data) => {
  try {
    const response = await apiClient.post('/mentors/apply', data)
    return response.data
  } catch (error) {
    console.error('Ошибка подачи заявки на менторство:', error)
    throw error
  }
}

/**
 * [Админ] Получить все ожидающие заявки на менторство
 */
export const getPendingMentorApplications = async () => {
  try {
    const response = await apiClient.get('/admin/mentor-applications')
    return response.data
  } catch (error) {
    console.error('Ошибка получения заявок на менторство:', error)
    throw error
  }
}

/**
 * [Админ] Одобрить заявку на менторство
 */
export const approveMentorApplication = async (userId) => {
  try {
    const response = await apiClient.put(`/admin/mentor-applications/${userId}/approve`)
    return response.data
  } catch (error) {
    console.error('Ошибка одобрения заявки:', error)
    throw error
  }
}

/**
 * [Админ] Отклонить заявку на менторство
 */
export const rejectMentorApplication = async (userId) => {
  try {
    const response = await apiClient.put(`/admin/mentor-applications/${userId}/reject`)
    return response.data
  } catch (error) {
    console.error('Ошибка отклонения заявки:', error)
    throw error
  }
}

/**
 * Отправка запроса на встречу с ментором (студент -> ментор)
 * Алиас requestMentorship для совместимости с существующим кодом
 */
export const requestMeeting = async (requestData) => {
  try {
    const response = await apiClient.post('/mentors/request-meeting', requestData)
    return response.data
  } catch (error) {
    console.error('Ошибка отправки запроса на встречу:', error)
    throw error
  }
}

export const requestMentorship = requestMeeting

/**
 * Получение входящих запросов на встречи (для ментора)
 */
export const getMentorRequests = async () => {
  try {
    const response = await apiClient.get('/mentors/requests/incoming')
    return response.data
  } catch (error) {
    console.error('Ошибка получения запросов для ментора:', error)
    return []
  }
}

/**
 * Обновление статуса запроса на встречу (принять/отклонить ментором)
 */
export const updateMeetingRequestStatus = async (requestId, status) => {
  try {
    const response = await apiClient.put(`/mentors/requests/${requestId}`, { status })
    return response.data
  } catch (error) {
    console.error('Ошибка обновления статуса встречи:', error)
    throw error
  }
}
/**
 * Создание широковещательного запроса на ментора (студент)
 */
export const createBroadcastMentorRequest = async (bookingId, stack) => {
  try {
    const response = await apiClient.post('/mentors/broadcast-request', { booking_id: bookingId, stack })
    return response.data
  } catch (error) {
    console.error('Ошибка создания broadcast-запроса:', error)
    throw error
  }
}

/**
 * Получение доступных broadcast-запросов (для ментора)
 */
export const getAvailableBroadcastRequests = async () => {
  try {
    const response = await apiClient.get('/mentors/broadcast-requests/available')
    return response.data
  } catch (error) {
    console.error('Ошибка получения доступных broadcast-запросов:', error)
    return []
  }
}

/**
 * Получение принятых ментором broadcast-запросов
 */
export const getMyBroadcastRequests = async () => {
  try {
    const response = await apiClient.get('/mentors/broadcast-requests/my')
    return response.data
  } catch (error) {
    console.error('Ошибка получения моих broadcast-запросов:', error)
    return []
  }
}

/**
 * Принятие broadcast-запроса (ментор)
 */
export const acceptBroadcastRequest = async (requestId) => {
  try {
    const response = await apiClient.put(`/mentors/broadcast-requests/${requestId}/accept`)
    return response.data
  } catch (error) {
    console.error('Ошибка принятия broadcast-запроса:', error)
    throw error
  }
}

/**
 * Получение списка доступных технологий
 */
export const getTechStacks = async () => {
  try {
    const response = await apiClient.get('/mentors/tech-stacks')
    return response.data
  } catch (error) {
    console.error('Ошибка получения списка технологий:', error)
    return []
  }
}

/**
 * Обновление профиля ментора (био, навыки, теги)
 */
export const updateMentorProfile = async (data) => {
  try {
    const response = await apiClient.put('/mentors/profile', data)
    return response.data
  } catch (error) {
    console.error('Ошибка обновления профиля ментора:', error)
    throw error
  }
}
