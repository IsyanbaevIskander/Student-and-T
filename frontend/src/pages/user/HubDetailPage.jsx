import { eventsApi } from '../../api/events'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getHubById } from '../../api/hubs'
import { createBooking } from '../../api/bookings'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../../components/ui/Loader'

const HubDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user, updateUser } = useAuth()

  const [hub, setHub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookedData, setBookedData] = useState(null)

  // Состояние формы
  const [bookingType, setBookingType] = useState('INDIVIDUAL')
  const [bookingDate, setBookingDate] = useState('')
  const [formData, setFormData] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    phone_number: '',
    event_title: '',
    event_description: '',
    max_attendees: 10,
    is_public: true,
    start_time: '09:00',
    end_time: '21:00'
  })

  // Подтягиваем данные пользователя
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        last_name: user.last_name || '',
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        phone_number: user.phone_number || ''
      }))
    }
  }, [user])

  useEffect(() => {
    const fetchHub = async () => {
      try {
        const data = await getHubById(parseInt(id))
        setHub(data)
      } catch (error) {
        console.error('Ошибка загрузки хаба:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHub()
  }, [id])

  const [error, setError] = useState(null)

  const handleBooking = async (e) => {
    e.preventDefault()
    setError(null)
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/hub/${id}` } })
      return
    }

    if (!bookingDate) {
      setError('Пожалуйста, выберите дату посещения')
      return
    }

    setBookingLoading(true)
    try {
      // 1. Если данные пользователя изменились или были пустыми, обновляем профиль
      // if (
      // formData.first_name !== user?.first_name ||
      // formData.last_name !== user?.last_name ||
      // formData.phone_number !== user?.phone_number
      // ) {
      // await updateUser({
      // first_name: formData.first_name,
      // last_name: formData.last_name,
      // middle_name: formData.middle_name,
      // phone_number: formData.phone_number
      // })
      // }

      // 2. Создаем бронирование
      const startAt = new Date(bookingDate)
      const [startH, startM] = formData.start_time.split(':')
      startAt.setHours(parseInt(startH), parseInt(startM), 0, 0)

      const endAt = new Date(bookingDate)
      const [endH, endM] = formData.end_time.split(':')
      endAt.setHours(parseInt(endH), parseInt(endM), 0, 0)

      // Небольшая валидация
      if (endAt <= startAt) {
        setError('Время окончания должно быть позже времени начала')
        setBookingLoading(false)
        return
      }

      let result;
      if (bookingType === 'EVENT') {
        const eventPayload = {
          hub_id: parseInt(id),
          title: formData.event_title || "Мероприятие",
          description: formData.event_description,
          start_time: startAt.toISOString(),
          end_time: endAt.toISOString(),
          max_attendees: parseInt(formData.max_attendees) || 10,
          is_public: formData.is_public
        };
        result = await eventsApi.createEvent(eventPayload);
      } else {
        const bookingPayload = {
          hub_id: parseInt(id),
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          booking_type: 'INDIVIDUAL',
        };
        result = await createBooking(bookingPayload);
      }

      setBookedData(Array.isArray(result) ? result[0] : result)
    } catch (err) {
      // Выводим только текст ошибки без статус-кодов
      const errorMessage = typeof err === 'string' ? err : (err.detail || 'Попробуйте отправить заявку позже');
      setError(errorMessage)
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) return <div className="py-20 text-center"><Loader size="lg" /></div>
  if (!hub) return <div className="py-20 text-center text-red-500">Хаб не найден</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="relative h-64 md:h-80">
          <img
            src={hub.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200'}
            className="w-full h-full object-cover"
            alt={hub.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{hub.name}</h1>
              <p className="text-gray-200 text-lg flex items-center gap-2">
                📍 {hub.location}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Информация о хабе */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-50 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-4">О пространстве</h3>
            <p className="text-gray-600 mb-6">{hub.info || hub.description}</p>

            <div className="flex flex-wrap gap-2">
              {(hub.facilities || ['Wi-Fi', 'Кофе', 'Принтер']).map((f, i) => (
                <span key={i} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-sm text-gray-500">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 rounded-3xl p-6 border border-yellow-100">
            <h4 className="font-bold text-yellow-800 mb-2">📢 Важно</h4>
            <p className="text-sm text-yellow-700 leading-relaxed">
              Для входа в хаб необходимо иметь при себе <b>документ, удостоверяющий личность</b> (паспорт или студенческий билет).
            </p>
          </div>
        </div>

        {/* Форма заявки */}
        <div className="lg:col-span-2">
          <form onSubmit={handleBooking} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-2xl font-bold mb-6">Оформить заявку</h2>

            {/* Выбор типа */}
            <div className="flex p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setBookingType('INDIVIDUAL')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition ${bookingType === 'INDIVIDUAL' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
              >
                Личный визит
              </button>
              <button
                type="button"
                onClick={() => setBookingType('EVENT')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition ${bookingType === 'EVENT' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
              >
                Мероприятие
              </button>
            </div>

            {/* Персональные данные */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Фамилия</label>
                <input
                  required
                  type="text"
                  placeholder="Иванов"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Имя</label>
                <input
                  required
                  type="text"
                  placeholder="Иван"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Отчество</label>
                <input
                  type="text"
                  placeholder="Иванович"
                  value={formData.middle_name}
                  onChange={e => setFormData({ ...formData, middle_name: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Телефон</label>
                <input
                  required
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  value={formData.phone_number}
                  onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                />
              </div>
            </div>

            {/* Дата */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1">Дата посещения</label>
              <input
                required
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
              />
              {bookingType === 'INDIVIDUAL' && (
                <p className="text-xs text-gray-400 ml-1">Бронирование действует на весь день (с 09:00 до 21:00)</p>
              )}
            </div>

            {/* Поля времени для мероприятий */}
            {bookingType === 'EVENT' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Время начала</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Время окончания</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                  />
                </div>
              </div>
            )}

            {/* Поля для мероприятия */}
            {bookingType === 'EVENT' && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Название мероприятия</label>
                  <input
                    required
                    type="text"
                    placeholder="Напр: Воркшоп по React"
                    value={formData.event_title}
                    onChange={e => setFormData({ ...formData, event_title: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Описание</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Подробно расскажите, о чем будет мероприятие..."
                    value={formData.event_description}
                    onChange={e => setFormData({ ...formData, event_description: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Макс. количество участников</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.max_attendees}
                    onChange={e => setFormData({ ...formData, max_attendees: parseInt(e.target.value) })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                  />
                </div>

                <div className="pt-4 space-y-3">
                  <label className="text-sm font-bold text-gray-400 ml-1">Тип мероприятия</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_public: true })}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-1 ${formData.is_public
                        ? 'border-tbank-yellow bg-yellow-50/50'
                        : 'border-gray-100 bg-gray-50/30'}`}
                    >
                      <span className={`text-sm font-bold ${formData.is_public ? 'text-black' : 'text-gray-500'}`}>🌐 Публичное</span>
                      <span className="text-[10px] text-gray-400 text-left">Будет отображаться в общей Афише сервиса</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_public: false })}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-1 ${!formData.is_public
                        ? 'border-tbank-yellow bg-yellow-50/50'
                        : 'border-gray-100 bg-gray-50/30'}`}
                    >
                      <span className={`text-sm font-bold ${!formData.is_public ? 'text-black' : 'text-gray-500'}`}>🔒 Приватное</span>
                      <span className="text-[10px] text-gray-400 text-left">Доступ только по прямой коду приглашения</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Вывод ошибки */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
                <span className="text-xl"></span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-800">{error}</p>
                  {error.includes('забронировали') && (
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="text-xs font-bold text-red-600 underline mt-1 hover:text-red-700"
                    >
                      Перейти в личный кабинет
                    </button>
                  )}
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
              </div>
            )}

            <button
              type="submit"
              disabled={bookingLoading}
              className="w-full py-5 bg-tbank-yellow text-black font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:hover:scale-100"
            >
              {bookingLoading ? <Loader size="sm" /> : 'Отправить заявку'}
            </button>
          </form>
        </div>
      </div>

      {/* Модалка успеха */}
      {bookedData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full text-center animate-scale-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="text-3xl font-bold mb-4">Заявка принята!</h3>
            <p className="text-gray-500 mb-8">
              {bookedData.status === 'APPROVED'
                ? 'Ваше бронирование успешно создано. Вы можете использовать QR-код ниже для входа.'
                : 'Ваша заявка на мероприятие отправлена на рассмотрение. После одобрения администратором QR-код появится в личном кабинете.'}
            </p>

            {bookedData.status === 'APPROVED' ? (
              <div className="bg-gray-50 p-6 rounded-3xl mb-8 border border-gray-100">
                <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Пропуск в хаб</p>
                <div className="bg-white p-4 rounded-2xl shadow-inner flex justify-center mb-4">
                  <QRCodeSVG value={bookedData.qr_code} size={150} />
                </div>
                <p className="text-xs text-gray-400">Покажите этот код на входе</p>
              </div>
            ) : (
              <div className="bg-yellow-50 p-6 rounded-3xl mb-8 border border-yellow-100 flex flex-col items-center">
                <span className="text-4xl mb-4">⏳</span>
                <p className="text-sm font-bold text-yellow-800 text-center">Ожидайте подтверждения</p>
                <p className="text-xs text-yellow-600 mt-2 text-center">Мы уведомим вас, как только администратор рассмотрит заявку</p>
              </div>
            )}

            {bookedData.invite_code && (
              <div className="mb-8 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest text-center">Ссылка для приглашения</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/events/join/${bookedData.invite_code}`}
                    className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-2 text-xs text-blue-700 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/events/join/${bookedData.invite_code}`);
                      alert('Ссылка скопирована!');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                  >
                    Копировать
                  </button>
                </div>
                <p className="text-[10px] text-blue-400 mt-2 text-center">
                  {bookedData.is_public 
                    ? 'По этой ссылке друзья смогут записаться быстрее' 
                    : 'Это единственный способ попасть на ваше приватное мероприятие'}
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 transition"
            >
              В личный кабинет
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HubDetailPage