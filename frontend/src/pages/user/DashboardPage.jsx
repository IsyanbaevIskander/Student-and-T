import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../hooks/useAuth'
import { getUserBookings } from '../../api/bookings'
import { 
  getMentorRequests, 
  updateMeetingRequestStatus, 
  applyToBecomeMentor, 
  getMentorById,
  getAvailableBroadcastRequests,
  acceptBroadcastRequest,
  createBroadcastMentorRequest,
  getTechStacks,
  updateMentorProfile
} from '../../api/mentors'
import { getHubs } from '../../api/hubs'
import { eventsApi } from '../../api/events'
import Loader from '../../components/ui/Loader'
import AdminHubsPage from '../admin/AdminHubsPage'
import AdminBookingsPage from '../admin/AdminBookingsPage'
import AdminMentorsPage from '../admin/AdminMentorsPage'

const DashboardPage = () => {
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [mentorRequests, setMentorRequests] = useState([])
  const [broadcastRequests, setBroadcastRequests] = useState([])
  const [myBroadcastRequests, setMyBroadcastRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingRequest, setUpdatingRequest] = useState(null)
  const [selectedQr, setSelectedQr] = useState(null)
  const [pendingEvents, setPendingEvents] = useState([])
  const [moderatingEvent, setModeratingEvent] = useState(null)

  const [requestingMentorForBooking, setRequestingMentorForBooking] = useState(null)
  const [requestStack, setRequestStack] = useState('')
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false)
  
  const [techStacks, setTechStacks] = useState([])
  const [selectedTags, setSelectedTags] = useState([])

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    phone_number: '',
    tg_username: ''
  })

  // Состояние для заявки в менторы
  const [mentorApplyForm, setMentorApplyForm] = useState({
    hub_id: ''
  })
  const [hubs, setHubs] = useState([])
  const [mentorProfile, setMentorProfile] = useState(null)
  const [submittingMentor, setSubmittingMentor] = useState(false)

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
          const [requestsData, broadcastData, myBroadcastData] = await Promise.all([
            getMentorRequests(),
            getAvailableBroadcastRequests(),
            getMyBroadcastRequests()
          ])
          setMentorRequests(requestsData)
          setBroadcastRequests(broadcastData)
          setMyBroadcastRequests(myBroadcastData)
        }
        
        if (userRole === 'ADMIN') {
          const pEvents = await eventsApi.getPendingEvents()
          setPendingEvents(pEvents)
        }

        // Загружаем данные для вкладки "Стать ментором"
        const [hubsData, stacksData] = await Promise.all([
          getHubs(),
          getTechStacks()
        ])
        setHubs(hubsData)
        setTechStacks(stacksData)

        try {
          const profile = await getMentorById(user.id)
          setMentorProfile(profile)
          if (profile.tags) {
            setSelectedTags(profile.tags.map(t => t.tag_name))
          }
        } catch (e) {
          // Профиля может не быть, это нормально
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
      await updateMeetingRequestStatus(requestId, status)
      const updatedRequests = await getMentorRequests()
      setMentorRequests(updatedRequests)
      alert(`Запрос ${status === 'APPROVED' ? 'принят' : 'отклонен'}`)
    } catch (error) {
      alert('Ошибка обновления статуса')
    } finally {
      setUpdatingRequest(null)
    }
  }

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleMentorApply = async (e) => {
    e.preventDefault()
    if (!mentorApplyForm.hub_id) {
      alert('Пожалуйста, выберите хаб')
      return
    }

    setSubmittingMentor(true)
    try {
      const response = await applyToBecomeMentor({
        ...mentorApplyForm,
        hub_id: parseInt(mentorApplyForm.hub_id),
        tags: selectedTags
      })
      
      setMentorProfile(response)
      alert('Заявка успешно отправлена!')
    } catch (error) {
      alert('Ошибка при подаче заявки: ' + (error.detail || 'Неизвестная ошибка'))
    } finally {
      setSubmittingMentor(false)
    }
  }

  const handleUpdateMentorProfile = async () => {
    setSubmittingMentor(true)
    try {
      await updateMentorProfile({ tags: selectedTags })
      alert('Технологии успешно обновлены!')
    } catch (error) {
      alert('Ошибка обновления профиля')
    } finally {
      setSubmittingMentor(false)
    }
  }

  const handleModerateEvent = async (eventId, action) => {
    setModeratingEvent(eventId)
    try {
      if (action === 'approve') {
        await eventsApi.approveEvent(eventId)
      } else {
        await eventsApi.rejectEvent(eventId)
      }
      const updated = await eventsApi.getPendingEvents()
      setPendingEvents(updated)
      alert(`Мероприятие ${action === 'approve' ? 'одобрено' : 'отклонено'}`)
    } catch (error) {
      alert('Ошибка при модерации')
    } finally {
      setModeratingEvent(null)
    }
  }

  const handleCreateBroadcast = async (e) => {
    e.preventDefault()
    if (!requestStack.trim()) return

    setSubmittingBroadcast(true)
    try {
      await createBroadcastMentorRequest(requestingMentorForBooking.id, requestStack)
      alert('Запрос отправлен всем подходящим менторам!')
      setRequestingMentorForBooking(null)
      setRequestStack('')
    } catch (error) {
      alert('Ошибка при отправке запроса')
    } finally {
      setSubmittingBroadcast(false)
    }
  }

  const handleAcceptBroadcast = async (requestId) => {
    setUpdatingRequest(requestId)
    try {
      await acceptBroadcastRequest(requestId)
      const [updated, my] = await Promise.all([
        getAvailableBroadcastRequests(),
        getMyBroadcastRequests()
      ])
      setBroadcastRequests(updated)
      setMyBroadcastRequests(my)
      alert('Вы успешно приняли запрос! Студент получит уведомление.')
    } catch (error) {
      alert('Не удалось принять запрос. Возможно, его уже занял другой ментор.')
      const updated = await getAvailableBroadcastRequests()
      setBroadcastRequests(updated)
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
          ...(userRole === 'MENTOR' ? [{ id: 'requests', label: `Запросы (${mentorRequests.length + broadcastRequests.length})`, icon: '' }] : []),
          { id: 'upgrade', label: 'Стать ментором', icon: '' },
          ...(userRole === 'ADMIN' ? [
            { id: 'admin-bookings', label: 'Заявки на хабы', icon: '' },
            { id: 'admin-hubs', label: 'Управление хабами', icon: '' },
            { id: 'admin-events', label: 'Модерация Афиши', icon: '' },
            { id: 'admin-mentors', label: 'Заявки менторов', icon: '' }
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
                      <p className="text-sm font-bold text-purple-900 mb-1">Мероприятие: {booking.event?.title}</p>
                      <p className="text-sm text-purple-700 line-clamp-2">{booking.event?.description}</p>
                      <div className="flex flex-col gap-1 mt-3">
                        <span className="text-xs font-bold text-purple-600">🏛️ {booking.event?.hub?.name}</span>
                        <span className="text-xs font-bold text-purple-600">📅 {booking.event?.start_time && format(new Date(booking.event.start_time), 'd MMMM, HH:mm', { locale: ru })}</span>
                      </div>
                      
                      {booking.event?.invite_code && (
                        <div className="mt-4 pt-4 border-t border-purple-100/50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Ссылка-приглашение</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${window.location.origin}/events/join/${booking.event.invite_code}`);
                              alert('Ссылка скопирована!');
                            }}
                            className="text-[10px] font-black text-purple-700 hover:text-purple-900 underline uppercase tracking-widest"
                          >
                            Копировать
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-sm text-blue-700">
                        Индивидуальное рабочее место в опенспейсе хаба.
                      </p>
                    </div>
                  )}


                  {booking.mentor && (
                    <div className="mb-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3 animate-fade-in">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-purple-100">
                        {booking.mentor.first_name?.[0] || 'M'}
                      </div>
                      <div>
                        <p className="text-[10px] text-purple-700 font-black uppercase tracking-widest leading-none mb-1">Ваш ментор на мероприятии</p>
                        <h4 className="font-bold text-gray-900 leading-tight">
                          {booking.mentor.first_name} {booking.mentor.last_name} {booking.mentor.middle_name || ''}
                        </h4>
                      </div>
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

                    {booking.status === 'APPROVED' && !booking.mentor && (
                      <button 
                        onClick={() => setRequestingMentorForBooking(booking)}
                        className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition shadow-lg"
                      >
                        🎓 Нужен ментор
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Модалка запроса ментора */}
          {requestingMentorForBooking && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setRequestingMentorForBooking(null)}>
              <div className="bg-white p-8 rounded-[40px] max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-2">Запрос ментора</h3>
                <p className="text-gray-500 mb-6 text-sm">Укажите ваш стек, чтобы найти подходящего ментора для этого мероприятия</p>

                <form onSubmit={handleCreateBroadcast}>
                  <div className="mb-6">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Выберите стек</label>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-2xl border-2 border-gray-100">
                      {techStacks.map(tag => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => setRequestStack(prev => prev === tag ? '' : tag)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                            requestStack === tag
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-500 border-gray-100 hover:border-purple-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRequestingMentorForBooking(null)
                        setRequestStack('')
                      }}
                      className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBroadcast || !requestStack}
                      className="flex-1 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {submittingBroadcast ? <Loader size="sm" color="white" /> : 'Отправить'}
                    </button>
                  </div>
                </form>
              </div>
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

      {/* Вкладка: Запросы (только для ментора) */}
      {activeTab === 'requests' && userRole === 'MENTOR' && (
        <div className="space-y-12 animate-fade-in">
          {/* Широковещательные запросы */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Подходящие заявки по вашему стеку</h2>
              <span className="px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                Общие заявки
              </span>
            </div>

            {broadcastRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-50 shadow-sm">
                <p className="text-gray-400 font-medium">Пока нет заявок, соответствующих вашим навыкам</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {broadcastRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-3xl p-6 border-2 border-purple-50 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                             {request.stack}
                           </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{request.event_title}</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Бронь #{request.booking_id} · {request.student_name}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
                      Студент ищет ментора по стеку <span className="text-purple-700 font-black">{request.stack}</span> для консультации на мероприятии.
                    </p>

                    <button
                      onClick={() => handleAcceptBroadcast(request.id)}
                      disabled={updatingRequest === request.id}
                      className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
                    >
                      {updatingRequest === request.id ? <Loader size="sm" color="white" /> : 'Взять заброс'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Принятые запросы (Accepted Broadcasts) */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Выбранные вами заявки</h2>
              <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                В работе
              </span>
            </div>

            {myBroadcastRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-50 shadow-sm">
                <p className="text-gray-400 font-medium">Вы еще не взяли ни одной заявки</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myBroadcastRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-3xl p-6 border-2 border-green-50 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                             {request.stack}
                           </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{request.event_title}</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Бронь #{request.booking_id} · {request.student_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl border border-green-100">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {request.student_name?.[0] || 'S'}
                      </div>
                      <p className="text-sm text-green-800 font-medium">Вы ментор этого студента</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Личные запросы */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Личные запросы (Slots)</h2>
              <span className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                Direct
              </span>
            </div>

            {mentorRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-50 shadow-sm">
                <p className="text-gray-400 font-medium">Нет личных запросов на встречи</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mentorRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-tbank-yellow text-xl font-bold">
                          {request.student_name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {request.student_name || `Студент #${request.student_id}`}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-gray-400 font-bold flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {request.slot_start && format(new Date(request.slot_start), 'd MMM, HH:mm', { locale: ru })}
                            </p>
                            <p className="text-sm text-gray-400 font-bold">
                              ID: #{request.id}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {request.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleUpdateRequest(request.id, 'APPROVED')}
                              disabled={updatingRequest === request.id}
                              className="bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 min-w-[120px]"
                            >
                              {updatingRequest === request.id ? <Loader size="sm" color="white" /> : 'Принять'}
                            </button>
                            <button
                              onClick={() => handleUpdateRequest(request.id, 'REJECTED')}
                              disabled={updatingRequest === request.id}
                              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
                            >
                              Отклонить
                            </button>
                          </>
                        ) : (
                          <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                            request.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {request.status === 'APPROVED' ? 'Принято' : 'Отклонено'}
                          </span>
                        )}
                      </div>
                    </div>
                    {request.message && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm italic text-gray-600">
                        "{request.message}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Вкладка: Стать ментором */}
      {activeTab === 'upgrade' && (
        <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm animate-fade-in max-w-2xl">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Станьте ментором</h2>
            <p className="text-gray-500 text-lg">
              Делитесь экспертизой, помогайте новичкам и развивайте сообщество Т-Банка вместе с нами.
            </p>
          </div>

          {userRole === 'MENTOR' ? (
            <div className="bg-green-50 border-2 border-green-100 p-10 rounded-[32px]">
              <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-green-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-green-900 text-center mb-2">Вы — ментор!</h3>
              <p className="text-green-700 font-medium text-center mb-10">Ваш профиль активен и виден другим студентам. Вы можете принимать запросы на консультации во вкладке «Запросы».</p>
              
              <div className="mt-8 pt-8 border-t border-green-100">
                <label className="block text-xs font-black text-green-800 uppercase tracking-widest mb-4">Ваши технологии</label>
                <div className="flex flex-wrap gap-2 mb-8">
                  {techStacks.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                        selectedTags.includes(tag)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-green-700 border-green-200 hover:border-green-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleUpdateMentorProfile}
                  disabled={submittingMentor}
                  className="w-full py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition disabled:opacity-50"
                >
                  {submittingMentor ? <Loader size="sm" color="white" /> : 'Обновить технологии'}
                </button>
              </div>
            </div>
          ) : mentorProfile?.status === 'PENDING' ? (
            <div className="bg-yellow-50 border-2 border-yellow-100 p-10 rounded-[32px] text-center">
              <div className="w-20 h-20 bg-tbank-yellow rounded-2xl flex items-center justify-center mx-auto mb-6 text-black shadow-lg shadow-yellow-100">
                <Clock className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-yellow-900 mb-2">Заявка на рассмотрении</h3>
              <p className="text-yellow-800 font-medium">Мы получили вашу анкету и скоро свяжемся с вами. Процесс модерации обычно занимает до 24 часов.</p>
            </div>
          ) : (
            <form onSubmit={handleMentorApply} className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Выберите хаб для работы</label>
                  <select 
                    required
                    value={mentorApplyForm.hub_id}
                    onChange={(e) => setMentorApplyForm({ ...mentorApplyForm, hub_id: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:outline-none focus:border-tbank-yellow transition-all font-bold"
                  >
                    <option value="">Выберите локацию...</option>
                    {hubs.map(hub => (
                      <option key={hub.id} value={hub.id}>{hub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Выберите ваши технологии</label>
                   <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                     {techStacks.map(tag => (
                       <button
                         type="button"
                         key={tag}
                         onClick={() => toggleTag(tag)}
                         className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                           selectedTags.includes(tag)
                             ? 'bg-black text-white border-black'
                             : 'bg-white text-gray-600 border-gray-200 hover:border-tbank-yellow'
                         }`}
                       >
                         {tag}
                       </button>
                     ))}
                   </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submittingMentor || selectedTags.length === 0}
                className="w-full py-5 bg-black text-white font-black rounded-3xl shadow-xl hover:shadow-2xl hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {submittingMentor ? <Loader size="sm" color="white" /> : 'Отправить заявку'}
              </button>

              {mentorProfile?.status === 'REJECTED' && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-bold">Ваша предыдущая заявка была отклонена. Вы можете попробовать отправить ее снова после обновления информации.</p>
                </div>
              )}

              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                Нажимая кнопку, вы соглашаетесь с правилами сообщества менторов
              </p>
            </form>
          )}
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

      {/* Вкладка: Заявки менторов (только для админа) */}
      {activeTab === 'admin-mentors' && userRole === 'ADMIN' && (
        <div className="animate-fade-in">
          <AdminMentorsPage />
        </div>
      )}

      {/* Вкладка: Модерация Афиши (только для админа) */}
      {activeTab === 'admin-events' && userRole === 'ADMIN' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Заявки на мероприятия</h2>
            <div className="text-sm text-gray-400 font-medium">
              Ожидают проверки: {pendingEvents.length}
            </div>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm animate-fade-in">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold">Очередь модерации пуста</p>
              <p className="text-sm text-gray-400 mt-2">Все мероприятия проверены и опубликованы</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pendingEvents.map((ev) => (
                <div key={ev.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row justify-between items-center gap-8">
                  <div className="flex-grow space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                       <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${ev.is_public ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                         {ev.is_public ? '🌐 Публичное' : '🔒 Приватное'}
                       </span>
                       <span className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                         На модерации
                       </span>
                       <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ID: #{ev.id}</span>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{ev.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">{ev.description || 'Описание отсутствует'}</p>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-tbank-yellow">
                           <Calendar className="w-5 h-5" />
                         </div>
                         <div className="text-left">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Дата и время</p>
                           <p className="text-sm font-bold text-gray-700">{format(new Date(ev.start_time), 'd MMMM, HH:mm', { locale: ru })}</p>
                         </div>
                       </div>

                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-tbank-yellow">
                           <MapPin className="w-5 h-5" />
                         </div>
                         <div className="text-left">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Локация</p>
                           <p className="text-sm font-bold text-gray-700">{ev.hub?.name || 'Не указан'}</p>
                         </div>
                       </div>

                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-tbank-yellow">
                           <Users className="w-5 h-5" />
                         </div>
                         <div className="text-left">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Лимит участников</p>
                           <p className="text-sm font-bold text-gray-700">{ev.max_attendees} человек</p>
                         </div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0 w-full lg:w-48">
                    <button
                      onClick={() => handleModerateEvent(ev.id, 'approve')}
                      disabled={moderatingEvent === ev.id}
                      className="flex-1 px-6 py-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {moderatingEvent === ev.id ? <Loader size="sm" color="white" /> : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Одобрить
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleModerateEvent(ev.id, 'reject')}
                      disabled={moderatingEvent === ev.id}
                      className="flex-1 px-6 py-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              
              {selectedQr.event?.invite_code && (
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Ссылка для приглашения</p>
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={`${window.location.origin}/events/join/${selectedQr.event.invite_code}`}
                      className="flex-1 bg-white border border-gray-100 rounded-lg px-2 py-1 text-[10px] text-gray-600 focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/events/join/${selectedQr.event.invite_code}`);
                        alert('Ссылка скопирована!');
                      }}
                      className="bg-black text-white px-2 py-1 rounded-lg text-[10px] font-bold"
                    >
                      Копи
                    </button>
                  </div>
                </div>
              )}
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