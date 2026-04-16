import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getHubById, getAvailablePlaces, bookPlace } from '../../api/hubs'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../../components/ui/Loader'
import HallSchema from '../../components/halls/HallSchema'

const HubDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  
  const [hub, setHub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedHall, setSelectedHall] = useState(null)
  const [availablePlaces, setAvailablePlaces] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  // Загрузка данных хаба
  useEffect(() => {
    const fetchHub = async () => {
      setLoading(true)
      try {
        const data = await getHubById(parseInt(id))
        setHub(data)
        // Автоматически выбираем первый зал
        if (data.halls && data.halls.length > 0) {
          setSelectedHall(data.halls[0])
        }
      } catch (error) {
        console.error('Ошибка загрузки хаба:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchHub()
  }, [id])

  // Загрузка доступных мест при выборе зала или даты
  useEffect(() => {
    if (selectedHall && selectedHall.type === 'individual' && bookingDate) {
      const fetchPlaces = async () => {
        try {
          const data = await getAvailablePlaces(selectedHall.id, bookingDate)
          setAvailablePlaces(data.places || [])
        } catch (error) {
          console.error('Ошибка загрузки мест:', error)
        }
      }
      fetchPlaces()
    }
  }, [selectedHall, bookingDate])

  const handleHallSelect = (hall) => {
    setSelectedHall(hall)
    setSelectedPlace(null)
    setAvailablePlaces([])
  }

  const handleSelectPlace = (place) => {
    setSelectedPlace(place)
  }

  const handleBooking = async () => {
    if (!isAuthenticated) {
      // Если не авторизован, перенаправляем на логин
      navigate('/login', { state: { from: `/hubs/${id}` } })
      return
    }

    if (!bookingDate || !bookingTime) {
      alert('Выберите дату и время')
      return
    }

    if (selectedHall.type === 'individual' && !selectedPlace) {
      alert('Выберите место')
      return
    }

    setBookingLoading(true)
    try {
      const bookingData = {
        hubId: hub.id,
        hallId: selectedHall.id,
        placeId: selectedHall.type === 'individual' ? selectedPlace.id : null,
        date: bookingDate,
        time: bookingTime,
        userId: user.id,
        type: selectedHall.type,
        status: selectedHall.type === 'individual' ? 'pending_mentor' : 'pending_admin'
      }
      
      await bookPlace(bookingData)
      alert('Бронирование отправлено на подтверждение!')
      setShowBookingModal(false)
      navigate('/my-bookings')
    } catch (error) {
      alert('Ошибка бронирования: ' + (error.message || 'Попробуйте позже'))
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loader size="lg" text="Загрузка хаба..." />
      </div>
    )
  }

  if (!hub) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Хаб не найден</h2>
        <button 
          onClick={() => navigate('/book-space')}
          className="mt-4 btn-primary"
        >
          Вернуться к списку
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Кнопка назад */}
      <button 
        onClick={() => navigate('/book-space')}
        className="mb-4 text-gray-600 hover:text-tbank-yellow transition flex items-center gap-1"
      >
        ← Назад к хабам
      </button>

      {/* Информация о хабе */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        {hub.image && (
          <img 
            src={hub.image} 
            alt={hub.name}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{hub.name}</h1>
          <div className="text-gray-600 mb-4">
            📍 {hub.city}, {hub.address}
          </div>
          <p className="text-gray-700 mb-4">{hub.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-semibold mb-2">Удобства:</h3>
              <ul className="flex flex-wrap gap-2">
                {hub.facilities.map((facility, idx) => (
                  <li key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {facility}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Режим работы:</h3>
              <p>{hub.workingHours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Список залов */}
      <h2 className="text-2xl font-bold mb-4">Залы и пространства</h2>
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {hub.halls.map((hall) => (
          <button
            key={hall.id}
            onClick={() => handleHallSelect(hall)}
            className={`
              px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap
              ${selectedHall?.id === hall.id 
                ? 'bg-tbank-yellow text-black' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            {hall.name} ({hall.type === 'individual' ? '👤 Индивидуальный' : '👥 Групповой'})
          </button>
        ))}
      </div>

      {/* Детали выбранного зала */}
      {selectedHall && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">{selectedHall.name}</h3>
            <p className="text-gray-600 mb-2">{selectedHall.description}</p>
            <div className="flex gap-4 text-sm">
              <span className="bg-blue-100 px-3 py-1 rounded">
                Вместимость: {selectedHall.capacity} чел.
              </span>
              <span className="bg-green-100 px-3 py-1 rounded">
                Бесплатно для студентов
              </span>
            </div>
            {selectedHall.type === 'group' && selectedHall.facilities && (
              <div className="mt-3">
                <span className="font-semibold">Оснащение:</span>
                <ul className="flex flex-wrap gap-2 mt-1">
                  {selectedHall.facilities.map((facility, idx) => (
                    <li key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {facility}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Форма бронирования */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4">Забронировать</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Дата</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Время</label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Выберите время</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                  <option value="18:00">18:00</option>
                </select>
              </div>
            </div>

            {/* Схема зала для индивидуальных мест */}
            {selectedHall.type === 'individual' && bookingDate && (
              <div className="mb-6">
                <HallSchema 
                  hall={selectedHall}
                  places={availablePlaces}
                  onSelectPlace={handleSelectPlace}
                />
                {selectedPlace && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    Выбрано место: <strong>{selectedPlace.number}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Кнопка бронирования */}
            <button
              onClick={() => setShowBookingModal(true)}
              disabled={!bookingDate || !bookingTime || (selectedHall.type === 'individual' && !selectedPlace)}
              className="w-full bg-tbank-yellow text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Забронировать
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Подтверждение бронирования</h3>
            <div className="space-y-2 mb-6">
              <p><strong>Хаб:</strong> {hub.name}</p>
              <p><strong>Зал:</strong> {selectedHall.name}</p>
              {selectedPlace && <p><strong>Место:</strong> {selectedPlace.number}</p>}
              <p><strong>Дата:</strong> {bookingDate}</p>
              <p><strong>Время:</strong> {bookingTime}</p>
              <p className="text-sm text-gray-600 mt-4">
                {selectedHall.type === 'individual' 
                  ? '📌 После бронирования необходимо дождаться подтверждения ментора'
                  : '📌 Групповые бронирования подтверждаются администратором'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="flex-1 bg-tbank-yellow text-black font-semibold py-2 rounded-lg hover:bg-yellow-500 disabled:opacity-50"
              >
                {bookingLoading ? 'Бронирование...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HubDetailPage