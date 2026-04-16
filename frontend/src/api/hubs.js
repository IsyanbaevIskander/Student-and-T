import apiClient from './client'

// Временные данные для заглушки
const MOCK_HUBS = {
  1: {
    id: 1,
    name: 'Технохаб Москва',
    city: 'Москва',
    address: 'ул. Тверская, 15',
    description: 'Современный IT-хаб с зонами для коворкинга, переговорными и местами для индивидуальной работы.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    facilities: ['Wi-Fi', 'Кондиционер', 'Кофе/чай', 'Проектор', 'Доска для записей', 'Розетки'],
    workingHours: '09:00 - 21:00',
    halls: [
      {
        id: 101,
        name: 'Зал "Разработка"',
        type: 'individual',
        capacity: 12,
        description: 'Тихий зал для индивидуальной работы и менторских сессий',
        pricePerHour: 0, // Бесплатно для студентов
        places: [
          { id: 1, number: 'Место 1', status: 'available', x: 0, y: 0, hasPc: true, hasMonitor: true },
          { id: 2, number: 'Место 2', status: 'available', x: 1, y: 0, hasPc: true, hasMonitor: true },
          { id: 3, number: 'Место 3', status: 'booked', x: 2, y: 0, hasPc: true, hasMonitor: true },
          { id: 4, number: 'Место 4', status: 'available', x: 3, y: 0, hasPc: false, hasMonitor: true },
          { id: 5, number: 'Место 5', status: 'available', x: 0, y: 1, hasPc: true, hasMonitor: true },
          { id: 6, number: 'Место 6', status: 'selected', x: 1, y: 1, hasPc: true, hasMonitor: true },
          { id: 7, number: 'Место 7', status: 'available', x: 2, y: 1, hasPc: true, hasMonitor: false },
          { id: 8, number: 'Место 8', status: 'maintenance', x: 3, y: 1, hasPc: true, hasMonitor: true },
          { id: 9, number: 'Место 9', status: 'available', x: 0, y: 2, hasPc: true, hasMonitor: true },
          { id: 10, number: 'Место 10', status: 'available', x: 1, y: 2, hasPc: true, hasMonitor: true },
          { id: 11, number: 'Место 11', status: 'booked', x: 2, y: 2, hasPc: true, hasMonitor: true },
          { id: 12, number: 'Место 12', status: 'available', x: 3, y: 2, hasPc: false, hasMonitor: false },
        ]
      },
      {
        id: 102,
        name: 'Зал "Коллаборация"',
        type: 'individual',
        capacity: 8,
        description: 'Зал для парного программирования и командной работы',
        pricePerHour: 0,
        places: [
          { id: 13, number: 'Место 1', status: 'available', x: 0, y: 0, hasPc: true, hasMonitor: true },
          { id: 14, number: 'Место 2', status: 'available', x: 1, y: 0, hasPc: true, hasMonitor: true },
          { id: 15, number: 'Место 3', status: 'available', x: 2, y: 0, hasPc: true, hasMonitor: true },
          { id: 16, number: 'Место 4', status: 'available', x: 3, y: 0, hasPc: true, hasMonitor: true },
          { id: 17, number: 'Место 5', status: 'available', x: 0, y: 1, hasPc: true, hasMonitor: true },
          { id: 18, number: 'Место 6', status: 'available', x: 1, y: 1, hasPc: true, hasMonitor: true },
          { id: 19, number: 'Место 7', status: 'available', x: 2, y: 1, hasPc: true, hasMonitor: true },
          { id: 20, number: 'Место 8', status: 'available', x: 3, y: 1, hasPc: true, hasMonitor: true },
        ]
      },
      {
        id: 103,
        name: 'Переговорная "Лекторий"',
        type: 'group',
        capacity: 20,
        description: 'Просторная комната для групповых занятий, воркшопов и лекций',
        pricePerHour: 0,
        facilities: ['Проектор', 'Доска', 'Микрофон', 'Колонки', 'Флипчарт']
      }
    ]
  },
  2: {
    id: 2,
    name: 'Цифровое пространство',
    city: 'Санкт-Петербург',
    address: 'Невский пр., 88',
    description: 'Пространство для IT-специалистов с зонами для командной работы и тихими местами для фокуса.',
    image: 'https://images.unsplash.com/photo-1497366811353-687f4e18c2c1?w=800',
    facilities: ['Wi-Fi', 'Кондиционер', 'Кофе/чай', 'Принтер', 'Кухня'],
    workingHours: '10:00 - 22:00',
    halls: [
      {
        id: 201,
        name: 'Коворкинг',
        type: 'individual',
        capacity: 16,
        description: 'Открытое пространство для работы',
        pricePerHour: 0,
        places: Array.from({ length: 16 }, (_, i) => ({
          id: 2000 + i,
          number: `Место ${i + 1}`,
          status: Math.random() > 0.7 ? 'booked' : 'available',
          x: i % 4,
          y: Math.floor(i / 4),
          hasPc: true,
          hasMonitor: true
        }))
      },
      {
        id: 202,
        name: 'Зал для воркшопов',
        type: 'group',
        capacity: 30,
        description: 'Большой зал для мероприятий',
        pricePerHour: 0,
        facilities: ['Проектор', 'Звук', 'Сцена', 'Трансляция']
      }
    ]
  }
}

/**
 * Получение списка всех хабов
 */
export const getHubs = async (filters = {}) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.get('/hubs/', { params: filters })
    // return response.data
    
    console.log('Получение хабов (заглушка):', filters)
    await new Promise(resolve => setTimeout(resolve, 500))
    return Object.values(MOCK_HUBS)
  } catch (error) {
    console.error('Ошибка получения хабов:', error)
    throw error
  }
}

/**
 * Получение детальной информации о хабе по ID
 * @param {number} id - ID хаба
 */
export const getHubById = async (id) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.get(`/hubs/${id}/`)
    // return response.data
    
    console.log('Получение хаба (заглушка):', id)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const hub = MOCK_HUBS[id]
    if (!hub) {
      throw { message: 'Хаб не найден' }
    }
    return hub
  } catch (error) {
    console.error('Ошибка получения хаба:', error)
    throw error
  }
}

/**
 * Получение доступных мест в зале на определённую дату
 * @param {number} hallId - ID зала
 * @param {string} date - дата в формате YYYY-MM-DD
 */
export const getAvailablePlaces = async (hallId, date) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.get(`/halls/${hallId}/available-places/`, { params: { date } })
    // return response.data
    
    console.log('Получение доступных мест (заглушка):', hallId, date)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Ищем зал в мок-данных
    let hall = null
    for (const hub of Object.values(MOCK_HUBS)) {
      hall = hub.halls.find(h => h.id === hallId)
      if (hall) break
    }
    
    if (!hall || hall.type !== 'individual') {
      return { places: [] }
    }
    
    return { places: hall.places }
  } catch (error) {
    console.error('Ошибка получения доступных мест:', error)
    throw error
  }
}

/**
 * Бронирование места
 * @param {Object} bookingData - данные бронирования
 */
export const bookPlace = async (bookingData) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.post('/bookings/', bookingData)
    // return response.data
    
    console.log('Бронирование (заглушка):', bookingData)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      id: Math.floor(Math.random() * 1000),
      status: 'pending',
      message: 'Бронирование создано, ожидает подтверждения',
      ...bookingData
    }
  } catch (error) {
    console.error('Ошибка бронирования:', error)
    throw error
  }
}