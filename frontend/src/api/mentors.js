import apiClient from './client'

// Временные данные для заглушки
const MOCK_MENTORS = [
  {
    id: 1,
    firstName: 'Алексей',
    lastName: 'Иванов',
    email: 'alexey@example.com',
    position: 'Senior Developer',
    company: 'Т-Технологии',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    bio: 'Эксперт в React, Python и FastAPI. Помогу с архитектурой приложений, оптимизацией производительности и best practices. Более 8 лет опыта.',
    technologies: ['React', 'Python', 'FastAPI', 'TypeScript', 'Next.js'],
    experience: 8,
    rating: 4.8,
    reviewsCount: 24,
    isAvailable: true
  },
  {
    id: 2,
    firstName: 'Елена',
    lastName: 'Смирнова',
    email: 'elena@example.com',
    position: 'Team Lead',
    company: 'Т-Технологии',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    bio: 'Team Lead с опытом управления командами до 10 человек. Помогу с карьерным ростом, code review и soft skills.',
    technologies: ['Java', 'Spring Boot', 'Microservices', 'Docker', 'Kubernetes'],
    experience: 10,
    rating: 4.9,
    reviewsCount: 42,
    isAvailable: true
  },
  {
    id: 3,
    firstName: 'Дмитрий',
    lastName: 'Петров',
    email: 'dmitry@example.com',
    position: 'Frontend Architect',
    company: 'Т-Технологии',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    bio: 'Frontend архитектор. Специализируюсь на React, Vue и Angular. Помогу разобраться с сложными концепциями и построить масштабируемую архитектуру.',
    technologies: ['React', 'Vue', 'Angular', 'Webpack', 'Vite', 'Tailwind'],
    experience: 7,
    rating: 4.7,
    reviewsCount: 18,
    isAvailable: true
  },
  {
    id: 4,
    firstName: 'Анна',
    lastName: 'Козлова',
    email: 'anna@example.com',
    position: 'Data Scientist',
    company: 'Т-Технологии',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    bio: 'Data Scientist с опытом в машинном обучении. Помогу с Python, Pandas, NumPy, построением моделей и анализом данных.',
    technologies: ['Python', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'SQL'],
    experience: 5,
    rating: 4.9,
    reviewsCount: 15,
    isAvailable: true
  },
  {
    id: 5,
    firstName: 'Сергей',
    lastName: 'Морозов',
    email: 'sergey@example.com',
    position: 'DevOps Engineer',
    company: 'Т-Технологии',
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    bio: 'DevOps инженер. Помогу с CI/CD, Docker, Kubernetes, облачными технологиями и автоматизацией процессов.',
    technologies: ['Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'AWS', 'Terraform'],
    experience: 6,
    rating: 4.8,
    reviewsCount: 21,
    isAvailable: false
  }
]

/**
 * Получение списка менторов
 * @param {Object} filters - фильтры поиска
 */
export const getMentors = async (filters = {}) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.get('/mentors/', { params: filters })
    // return response.data
    
    console.log('Получение менторов (заглушка):', filters)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let filteredMentors = [...MOCK_MENTORS]
    
    // Поиск по имени или технологиям
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredMentors = filteredMentors.filter(mentor =>
        `${mentor.firstName} ${mentor.lastName}`.toLowerCase().includes(searchLower) ||
        mentor.bio.toLowerCase().includes(searchLower) ||
        mentor.technologies.some(tech => tech.toLowerCase().includes(searchLower))
      )
    }
    
    // Фильтр по технологиям
    if (filters.technology && filters.technology !== 'all') {
      filteredMentors = filteredMentors.filter(mentor =>
        mentor.technologies.some(tech => tech.toLowerCase() === filters.technology.toLowerCase())
      )
    }
    
    return filteredMentors
  } catch (error) {
    console.error('Ошибка получения менторов:', error)
    throw error
  }
}

/**
 * Получение ментора по ID
 */
export const getMentorById = async (id) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.get(`/mentors/${id}/`)
    // return response.data
    
    console.log('Получение ментора (заглушка):', id)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const mentor = MOCK_MENTORS.find(m => m.id === parseInt(id))
    if (!mentor) throw { message: 'Ментор не найден' }
    return mentor
  } catch (error) {
    console.error('Ошибка получения ментора:', error)
    throw error
  }
}

/**
 * Отправка запроса на менторство
 * @param {Object} requestData - данные запроса
 */
export const requestMentorship = async (requestData) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.post('/mentorship-requests/', requestData)
    // return response.data
    
    console.log('Запрос на менторство (заглушка):', requestData)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      id: Math.floor(Math.random() * 1000),
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...requestData
    }
  } catch (error) {
    console.error('Ошибка отправки запроса:', error)
    throw error
  }
}

/**
 * Получение списка запросов для ментора
 */
export const getMentorRequests = async () => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.get('/mentorship-requests/mentor/')
    // return response.data
    
    console.log('Получение запросов для ментора (заглушка)')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Возвращаем пустой массив, пока нет реальных запросов
    return []
  } catch (error) {
    console.error('Ошибка получения запросов:', error)
    throw error
  }
}

/**
 * Обновление статуса запроса (принять/отклонить)
 */
export const updateRequestStatus = async (requestId, status) => {
  try {
    // TODO: Раскомментировать когда появится бэкенд
    // const response = await apiClient.patch(`/mentorship-requests/${requestId}/`, { status })
    // return response.data
    
    console.log('Обновление статуса запроса (заглушка):', requestId, status)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return { id: requestId, status }
  } catch (error) {
    console.error('Ошибка обновления статуса:', error)
    throw error
  }
}