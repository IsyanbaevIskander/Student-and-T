import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getUserBookings } from '../../api/bookings'
import { getMentorRequests, updateRequestStatus } from '../../api/mentors'
import Loader from '../../components/ui/Loader'

const DashboardPage = () => {
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [mentorRequests, setMentorRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingRequest, setUpdatingRequest] = useState(null)
  
  // Определяем роль пользователя
  const userRole = user?.role || 'client'
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Загружаем бронирования для всех
        const bookingsData = await getUserBookings()
        setBookings(bookingsData)
        
        // Если пользователь - ментор, загружаем запросы
        if (userRole === 'mentor') {
          const requestsData = await getMentorRequests()
          setMentorRequests(requestsData)
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated, userRole])
  
  const handleUpdateRequest = async (requestId, status) => {
    setUpdatingRequest(requestId)
    try {
      await updateRequestStatus(requestId, status)
      // Обновляем список запросов
      const updatedRequests = await getMentorRequests()
      setMentorRequests(updatedRequests)
      alert(`Запрос ${status === 'approved' ? 'принят' : 'отклонен'}`)
    } catch (error) {
      alert('Ошибка обновления статуса')
    } finally {
      setUpdatingRequest(null)
    }
  }
  
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')
    if (confirmed) {
      try {
        // TODO: вызвать API удаления
        await logout()
        navigate('/')
      } catch (error) {
        alert('Ошибка удаления аккаунта')
      }
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loader size="lg" text="Загрузка..." />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Личный кабинет</h1>
      <p className="text-gray-600 mb-8">
        {user?.firstName} {user?.lastName} · {user?.email}
      </p>
      
      {/* Вкладки */}
      <div className="flex gap-2 border-b mb-6">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'bookings' 
              ? 'text-tbank-yellow border-b-2 border-tbank-yellow' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Мои встречи
        </button>
        
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'profile' 
              ? 'text-tbank-yellow border-b-2 border-tbank-yellow' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Профиль
        </button>
        
        {userRole === 'mentor' && (
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === 'requests' 
                ? 'text-tbank-yellow border-b-2 border-tbank-yellow' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Заявки ({mentorRequests.length})
          </button>
        )}
        
        <button
          onClick={() => setActiveTab('upgrade')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'upgrade' 
              ? 'text-tbank-yellow border-b-2 border-tbank-yellow' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Повысить роль
        </button>
      </div>
      
      {/* Вкладка: Мои встречи */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Мои бронирования</h2>
            <button
              onClick={() => navigate('/book-space')}
              className="btn-primary"
            >
              + Новая встреча
            </button>
          </div>
          
          {bookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-600 mb-4">У вас пока нет активных бронирований</p>
              <button
                onClick={() => navigate('/book-space')}
                className="btn-primary"
              >
                Забронировать место
              </button>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">
                      {booking.placeName || `Бронирование #${booking.id}`}
                    </h3>
                    <p className="text-gray-600">
                      📅 {booking.date} в {booking.time}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Статус: {getStatusText(booking.status)}
                    </p>
                    {booking.mentor && (
                      <p className="text-sm text-green-600 mt-1">
                        👨‍🏫 Ментор: {booking.mentor}
                      </p>
                    )}
                  </div>
                  
                  {!booking.mentor && booking.status !== 'mentor_requested' && (
                    <button
                      onClick={() => navigate(`/mentors?bookingId=${booking.id}`)}
                      className="bg-tbank-yellow text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition"
                    >
                      Пригласить ментора
                    </button>
                  )}
                  
                  {booking.status === 'mentor_requested' && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      Ожидает ответа ментора
                    </span>
                  )}
                  
                  {booking.status === 'mentor_confirmed' && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      Ментор подтверждён
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Вкладка: Профиль */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Информация об аккаунте</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                type="text"
                defaultValue={user?.firstName || ''}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Введите имя"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
              <input
                type="text"
                defaultValue={user?.lastName || ''}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Введите фамилию"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
              <input
                type="text"
                value={userRole === 'client' ? 'Клиент' : userRole === 'mentor' ? 'Ментор' : 'Администратор'}
                className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                disabled
              />
            </div>
            
            <button className="btn-primary w-full md:w-auto">
              Сохранить изменения
            </button>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="font-bold text-red-600 mb-2">Опасная зона</h3>
            <button
              onClick={handleDeleteAccount}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Удалить аккаунт
            </button>
          </div>
        </div>
      )}
      
      {/* Вкладка: Заявки (только для ментора) */}
      {activeTab === 'requests' && userRole === 'mentor' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Запросы на менторство</h2>
          
          {mentorRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-600">Нет активных запросов</p>
            </div>
          ) : (
            mentorRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">
                      {request.studentName || `Студент #${request.studentId}`}
                    </h3>
                    <p className="text-gray-600 mt-1">{request.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Бронирование: {request.bookingId}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateRequest(request.id, 'approved')}
                      disabled={updatingRequest === request.id}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {updatingRequest === request.id ? <Loader size="sm" color="white" /> : 'Принять'}
                    </button>
                    <button
                      onClick={() => handleUpdateRequest(request.id, 'rejected')}
                      disabled={updatingRequest === request.id}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Вкладка: Повысить роль */}
      {activeTab === 'upgrade' && (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md">
          <h2 className="text-xl font-bold mb-4">Повышение роли</h2>
          <p className="text-gray-600 mb-4">
            Вы можете повысить свою роль для получения дополнительных возможностей
          </p>
          
          <select className="w-full border rounded-lg px-3 py-2 mb-4">
            <option value="">Выберите роль</option>
            {userRole === 'client' && <option value="mentor">Ментор</option>}
            {userRole !== 'admin' && <option value="admin">Администратор</option>}
          </select>
          
          <button className="btn-primary w-full">
            Отправить заявку
          </button>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            Заявка будет рассмотрена администратором
          </p>
        </div>
      )}
    </div>
  )
}

// Вспомогательная функция для отображения статуса
const getStatusText = (status) => {
  const statusMap = {
    'pending': '⏳ Ожидает подтверждения',
    'approved': '✅ Подтверждено',
    'rejected': '❌ Отклонено',
    'cancelled': '🚫 Отменено',
    'mentor_requested': '👨‍🏫 Ожидает ответа ментора',
    'mentor_confirmed': '🎉 Ментор подтверждён',
    'mentor_rejected': '😔 Ментор отклонил'
  }
  return statusMap[status] || status
}

export default DashboardPage