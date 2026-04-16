import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../hooks/useAuth'
import { getUserBookings } from '../../api/bookings'
import { getMentorRequests, updateRequestStatus } from '../../api/mentors'
import Loader from '../../components/ui/Loader'
import AdminHubsPage from '../admin/AdminHubsPage'
import AdminBookingsPage from '../admin/AdminBookingsPage'

const DashboardPage = () => {
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [mentorRequests, setMentorRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingRequest, setUpdatingRequest] = useState(null)
  const [selectedQr, setSelectedQr] = useState(null)

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    phone_number: '',
    tg_username: ''
  })

  // Определяем роль пользователя
  const userRole = user?.role || 'STUDENT'

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        middle_name: user.middle_name || '',
        phone_number: user.phone_number || '',
        tg_username: user.tg_username || ''
      })
    }
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const bookingsData = await getUserBookings()
        setBookings(bookingsData)

        if (userRole === 'MENTOR') {
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

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
      await updateUser(profileForm)
      alert('Профиль успешно обновлен')
    } catch (error) {
      alert('Ошибка обновления профиля: ' + (error.detail || 'Неизвестная ошибка'))
    }
  }

  const handleUpdateRequest = async (requestId, status) => {
    setUpdatingRequest(requestId)
    try {
      await updateRequestStatus(requestId, status)
      const updatedRequests = await getMentorRequests()
      setMentorRequests(updatedRequests)
      alert(`Запрос ${status === 'APPROVED' ? 'принят' : 'отклонен'}`)
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
        await logout()
        navigate('/')
      } catch (error) {
        alert('Ошибка удаления аккаунта')
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center">
        <Loader size="lg" text="Загрузка данных..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Личный кабинет</h1>
          <p className="text-gray-500 text-lg">
            {user?.last_name} {user?.first_name} · {user?.email}
          </p>
        </div>
        <div className="flex gap-3">
          <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700">
            {userRole === 'ADMIN' ? 'Администратор' : userRole === 'MENTOR' ? 'Ментор' : 'Студент'}
          </span>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-8 border-b border-gray-100 mb-8">
        {[
          { id: 'bookings', label: 'Бронирования', icon: '' },
          { id: 'profile', label: 'Профиль', icon: '' },
          ...(userRole === 'MENTOR' ? [{ id: 'requests', label: `Заявки (${mentorRequests.length})`, icon: '' }] : []),
          { id: 'upgrade', label: 'Развитие', icon: '' },
          ...(userRole === 'ADMIN' ? [
            { id: 'admin-bookings', label: 'Заявки на хабы', icon: '' },
            { id: 'admin-hubs', label: 'Управление хабами', icon: '' }
          ] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 font-bold transition-all flex items-center gap-2 relative ${activeTab === tab.id
                ? 'text-tbank-yellow'
                : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-tbank-yellow rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Вкладка: Бронирования */}
      {activeTab === 'bookings' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Мои бронирования</h2>
            <button
              onClick={() => navigate('/book-space')}
              className="px-6 py-2 bg-tbank-yellow text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition"
            >
              + Новая бронь
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-50 shadow-sm">
              <div className="text-6xl mb-4 text-gray-200">📭</div>
              <p className="text-gray-500 mb-8 text-lg">У вас пока нет активных бронирований</p>
              <button
                onClick={() => navigate('/book-space')}
                className="px-8 py-3 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition"
              >
                Забронировать сейчас
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block ${booking.booking_type === 'EVENT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {booking.booking_type === 'EVENT' ? 'МЕРОПРИЯТИЕ' : 'ИНДИВИДУАЛЬНОЕ'}
                      </span>
                      <h3 className="font-bold text-xl">
                        Бронирование #{booking.id}
                      </h3>
                      <p className="text-gray-500 font-medium">
                        {new Date(booking.start_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        ⏱ {new Date(booking.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {new Date(booking.end_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                  </div>

                  {booking.booking_type === 'EVENT' ? (
                    <div className="mb-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                      <p className="text-sm font-bold text-purple-900 mb-1">О мероприятии:</p>
                      <p className="text-sm text-purple-700 line-clamp-3">{booking.event_description}</p>
                      <div className="flex gap-4 mt-3">
                        <span className="text-xs font-bold text-purple-600">👥 {booking.event_attendees} чел.</span>
                        <span className="text-xs font-bold text-purple-600">🏛️ Групповой зал</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-sm text-blue-700">
                        Индивидуальное рабочее место в опенспейсе хаба.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-6">
                    {booking.status === 'APPROVED' ? (
                      <button
                        onClick={() => setSelectedQr(booking)}
                        className="flex-1 py-3 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg"
                      >
                        <span>📱 QR-код</span>
                      </button>
                    ) : booking.status === 'PENDING' ? (
                      <div className="flex-1 py-3 bg-yellow-50 text-yellow-700 font-bold rounded-2xl text-center text-sm border border-yellow-100 italic">
                        Ожидает подтверждения
                      </div>
                    ) : (
                      <div className="flex-1 py-3 bg-red-50 text-red-700 font-bold rounded-2xl text-center text-sm border border-red-100 italic">
                        Отказано в посещении
                      </div>
                    )}
                    
                    {booking.status === 'APPROVED' && !booking.is_checked_in && (
                      <button className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition">
                        Отменить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Вкладка: Профиль */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-fade-in max-w-2xl">
          <h2 className="text-2xl font-bold mb-6">Настройки профиля</h2>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Фамилия</label>
                <input
                  type="text"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-tbank-yellow"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Имя</label>
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-tbank-yellow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Отчество</label>
              <input
                type="text"
                value={profileForm.middle_name}
                onChange={(e) => setProfileForm({ ...profileForm, middle_name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-tbank-yellow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Номер телефона</label>
                <input
                  type="text"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-tbank-yellow"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Telegram username</label>
                <input
                  type="text"
                  value={profileForm.tg_username}
                  onChange={(e) => setProfileForm({ ...profileForm, tg_username: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-tbank-yellow"
                  placeholder="@username"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button type="submit" className="flex-1 py-4 bg-tbank-yellow text-black font-bold rounded-2xl hover:shadow-lg transition">
                Сохранить изменения
              </button>
              <button type="button" onClick={logout} className="px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition">
                Выйти
              </button>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="font-bold text-red-600 mb-2">Удаление аккаунта</h3>
            <p className="text-sm text-gray-400 mb-4">После удаления все ваши бронирования и данные будут безвозвратно удалены.</p>
            <button
              onClick={handleDeleteAccount}
              className="text-red-500 font-bold hover:text-red-600 underline"
            >
              Удалить мой профиль
            </button>
          </div>
        </div>
      )}

      {/* Вкладка: Заявки (только для ментора) */}
      {activeTab === 'requests' && userRole === 'MENTOR' && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6">Запросы на менторство</h2>

          {mentorRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-50 shadow-sm">
              <p className="text-gray-500">Нет активных запросов</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mentorRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {request.studentName || `Студент #${request.studentId}`}
                      </h3>
                      <p className="text-gray-600 mt-1">{request.message}</p>
                      <p className="text-xs text-gray-400 mt-3 font-medium uppercase tracking-wider">
                        Бронирование ID: {request.bookingId}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateRequest(request.id, 'APPROVED')}
                        disabled={updatingRequest === request.id}
                        className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50"
                      >
                        {updatingRequest === request.id ? <Loader size="sm" color="white" /> : 'Принять'}
                      </button>
                      <button
                        onClick={() => handleUpdateRequest(request.id, 'REJECTED')}
                        disabled={updatingRequest === request.id}
                        className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50"
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Вкладка: Развитие (Повысить роль) */}
      {activeTab === 'upgrade' && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-fade-in max-w-md">
          <h2 className="text-2xl font-bold mb-4">Стать ментором</h2>
          <p className="text-gray-500 mb-8">
            Если вы хотите делиться знаниями и помогать другим студентам, подайте заявку на роль ментора.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Желаемая роль</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-tbank-yellow">
                <option value="MENTOR">Ментор</option>
                <option value="ADMIN">Администратор (требует подтверждения)</option>
              </select>
            </div>

            <button className="w-full py-4 bg-black text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition">
              Отправить заявку
            </button>

            <p className="text-xs text-center text-gray-400">
              Ваша заявка будет рассмотрена администратором в течение 24 часов.
            </p>
          </div>
        </div>
      )}

      {/* Вкладка: Управление хабами (только для админа) */}
      {activeTab === 'admin-hubs' && userRole === 'ADMIN' && (
        <div className="animate-fade-in">
          <AdminHubsPage />
        </div>
      )}

      {/* Вкладка: Управление заявками (только для админа) */}
      {activeTab === 'admin-bookings' && userRole === 'ADMIN' && (
        <div className="animate-fade-in">
          <AdminBookingsPage />
        </div>
      )}

      {/* Модалка QR-кода */}
      {selectedQr && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedQr(null)}>
          <div className="bg-white p-8 rounded-[40px] max-w-sm w-full text-center shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-2">Ваш пропуск</h3>
            <p className="text-gray-500 mb-8 text-sm">Покажите этот код на входе в хаб</p>

            <div className="bg-gray-50 p-6 rounded-2xl mb-6 flex justify-center border-4 border-gray-50 shadow-inner">
              <QRCodeSVG value={selectedQr.qr_code || 'INVALID'} size={200} />
            </div>

            <div className="text-sm bg-gray-50 p-4 rounded-2xl text-left mb-8 space-y-2">
              <p className="flex justify-between">
                <span className="text-gray-400">Бронь</span>
                <span className="font-bold">#{selectedQr.id}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Статус</span>
                <span className="font-bold text-green-600">{getStatusText(selectedQr.status)}</span>
              </p>
            </div>

            <button
              onClick={() => setSelectedQr(null)}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const getStatusText = (status) => {
  const statusMap = {
    'PENDING': 'Ожидает',
    'APPROVED': 'Подтверждено',
    'REJECTED': 'Отклонено',
    'CANCELLED': 'Отменено'
  }
  return statusMap[status] || status
}

export default DashboardPage