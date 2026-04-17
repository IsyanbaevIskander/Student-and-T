import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getMentors, requestMeeting as requestMentorship } from '../../api/mentors'
import { getUserBookings, updateBookingMentor } from '../../api/bookings'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../../components/ui/Loader'

const MentorsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  
  const [mentors, setMentors] = useState([])
  const [allMentors, setAllMentors] = useState([]) // Сохраняем всех менторов из бэкенда
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTechnology, setSelectedTechnology] = useState('all')
  const [userBookings, setUserBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [requestLoading, setRequestLoading] = useState(null)
  
  // Получаем bookingId из URL если есть
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const bookingId = params.get('bookingId')
    if (bookingId) {
      setSelectedBookingId(bookingId)
    }
  }, [location])
  
  // Загрузка менторов и бронирований пользователя (только один раз при загрузке страницы)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [mentorsData, bookingsData] = await Promise.all([
          getMentors(), // Загружаем всех менторов без фильтров
          isAuthenticated ? getUserBookings() : []
        ])
        setAllMentors(mentorsData)
        setMentors(mentorsData) // Изначально показываем всех
        setUserBookings(bookingsData)
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [isAuthenticated]) // Только при монтировании и изменении isAuthenticated
  
  // Фильтрация менторов на фронтенде (без запроса к бэкенду)
  useEffect(() => {
    if (allMentors.length === 0) return
    
    let filtered = [...allMentors]
    
    // Поиск по имени, фамилии, описанию или технологиям
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(mentor =>
        `${mentor.first_name || ''} ${mentor.last_name || ''}`.toLowerCase().includes(searchLower) ||
        (mentor.bio && mentor.bio.toLowerCase().includes(searchLower)) ||
        (mentor.tags && mentor.tags.some(tag => tag.tag_name.toLowerCase().includes(searchLower))) ||
        (mentor.skills && mentor.skills.toLowerCase().includes(searchLower))
      )
    }
    
    // Фильтр по технологии
    if (selectedTechnology && selectedTechnology !== 'all') {
      filtered = filtered.filter(mentor =>
        (mentor.tags && mentor.tags.some(tag => tag.tag_name.toLowerCase() === selectedTechnology.toLowerCase())) ||
        (mentor.skills && mentor.skills.toLowerCase().includes(selectedTechnology.toLowerCase()))
      )
    }
    
    setMentors(filtered)
  }, [searchTerm, selectedTechnology, allMentors]) // Срабатывает при изменении фильтров
  
  // Получаем все уникальные технологии из списка менторов
  const allTechnologies = [...new Set(allMentors.flatMap(m => m.tags ? m.tags.map(t => t.tag_name) : []))]
  
  // Фильтруем бронирования, которые ещё без ментора
  const bookingsWithoutMentor = userBookings.filter(
    booking => !booking.mentor && booking.status !== 'cancelled'
  )
  
  const handleRequestMentorship = async (mentor) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/mentors' } })
      return
    }
    
    if (!selectedBookingId && bookingsWithoutMentor.length > 0) {
      alert('Пожалуйста, выберите бронирование, к которому хотите пригласить ментора')
      return
    }
    
    if (!selectedBookingId) {
      alert('У вас нет активных бронирований. Сначала забронируйте место в IT-хабе')
      return
    }
    
    setRequestLoading(mentor.id)
    try {
      // Создаем запрос на менторство
      const requestData = {
        mentor_id: mentor.user_id || mentor.id,
        mentorName: `${mentor.first_name || ''} ${mentor.last_name || ''}`,
        studentId: user.id,
        studentName: `${user.first_name || ''} ${user.last_name || ''}`,
        bookingId: selectedBookingId,
        message: `Приглашаю вас на менторскую сессию. Бронирование #${selectedBookingId}`,
        status: 'pending'
      }
      
      const result = await requestMentorship(requestData)
      
      // Обновляем бронирование, связывая с запросом
      await updateBookingMentor(parseInt(selectedBookingId), result.id)
      
      alert(`Запрос ментору ${mentor.first_name || ''} ${mentor.last_name || ''} отправлен!`)
      
      // Перезагружаем бронирования
      const updatedBookings = await getUserBookings()
      setUserBookings(updatedBookings)
      
    } catch (error) {
      alert('Ошибка отправки запроса: ' + (error.message || 'Попробуйте позже'))
    } finally {
      setRequestLoading(null)
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loader size="lg" text="Загрузка менторов..." />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Наши менторы</h1>
      
      {/* Блок выбора бронирования (сверху) */}
      {isAuthenticated && (
        <div className="bg-yellow-50 rounded-xl p-6 mb-8">
          {bookingsWithoutMentor.length > 0 ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите бронирование для приглашения ментора:
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              >
                <option value="">-- Выберите бронирование --</option>
                {bookingsWithoutMentor.map(booking => (
                  <option key={booking.id} value={booking.id}>
                    {booking.placeName || `Бронирование #${booking.id}`} - {booking.date} в {booking.time}
                  </option>
                ))}
              </select>
              {location.search.includes('bookingId') && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Выбрано бронирование из предыдущего шага
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-blue-700">
              ℹ️ У вас нет активных бронирований. 
              <button 
                onClick={() => navigate('/book-space')}
                className="ml-2 text-tbank-yellow hover:underline font-semibold"
              >
                Забронировать место →
              </button>
            </p>
          )}
        </div>
      )}
      
      {/* Фильтры и поиск (снизу от бронирований) */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Поиск */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Поиск по имени, описанию или технологиям
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="React, Python, архитектура..."
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
            />
          </div>
          
          {/* Фильтр по технологиям */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фильтр по технологии
            </label>
            <select
              value={selectedTechnology}
              onChange={(e) => setSelectedTechnology(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
            >
              <option value="all">Все технологии</option>
              {allTechnologies.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Список менторов */}
      {mentors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Менторы не найдены по вашему запросу
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={mentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.first_name || 'M')}&background=random`} 
                    alt={`${mentor.first_name} ${mentor.last_name}`}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="text-xl font-bold">
                      {mentor.first_name} {mentor.last_name}
                    </h3>
                    <p className="text-gray-600 font-medium">{mentor.user_email || mentor.position}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-3">{mentor.bio}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.tags && mentor.tags.slice(0, 5).map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm font-bold text-gray-500">
                      {tag.tag_name}
                    </span>
                  ))}
                  {!mentor.tags && mentor.skills && mentor.skills.split(',').slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm font-bold text-gray-500">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleRequestMentorship(mentor)}
                    disabled={!mentor.isAvailable || requestLoading === mentor.id || (!selectedBookingId && bookingsWithoutMentor.length > 0)}
                    className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requestLoading === mentor.id ? (
                      <Loader size="sm" color="yellow" />
                    ) : (
                      'Запросить менторство'
                    )}
                  </button>
                </div>
                
                {!mentor.isAvailable && (
                  <p className="text-sm text-red-500 mt-2">Временно недоступен</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MentorsPage