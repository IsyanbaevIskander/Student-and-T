import { useState, useEffect } from 'react'
import { getAllBookings, updateBookingStatus } from '../../api/bookings'
import Loader from '../../components/ui/Loader'

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const data = await getAllBookings()
      setBookings(data)
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setActionLoading(bookingId)
    try {
      await updateBookingStatus(bookingId, newStatus)
      // Локально обновляем статус в списке
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ))
      // Если открыта модалка этого бронирования, обновляем и там
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus })
      }
    } catch (error) {
      alert('Ошибка при обновлении статуса')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="py-20 text-center"><Loader size="lg" /></div>

  return (
    <div className="py-2">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Управление заявками</h2>
        <p className="text-gray-500 text-sm">Подтверждение мероприятий и просмотр всех бронирований</p>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID / Тип</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Пользователь</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Хаб / Дата</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-gray-400 mb-1">#{booking.id}</div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      booking.booking_type === 'EVENT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {booking.booking_type === 'EVENT' ? 'EVENT' : 'INDIV.'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-gray-900">
                      {booking.user ? `${booking.user.last_name} ${booking.user.first_name}` : `User #${booking.user_id}`}
                    </div>
                    <div className="text-xs text-gray-500">{booking.user?.phone_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold">{booking.hub?.name || `Хаб #${booking.hub_id}`}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(booking.start_at).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                      
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
                        title="Подробнее"
                      >
                        📄
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-sm italic">
                    Заявок пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалка подробностей */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Детали заявки #{selectedBooking.id}</span>
                <h3 className="text-3xl font-bold">Организация мероприятия</h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-black transition">
                 <span className="text-2xl">✕</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                 <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Заявитель</h4>
                    <p className="font-bold text-lg">{selectedBooking.user?.last_name} {selectedBooking.user?.first_name} {selectedBooking.user?.middle_name}</p>
                    <p className="text-gray-600 font-medium">{selectedBooking.user?.phone_number}</p>
                    <p className="text-gray-500 text-sm">{selectedBooking.user?.email}</p>
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Хаб</h4>
                    <p className="font-bold">{selectedBooking.hub?.name}</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(selectedBooking.start_at).toLocaleDateString('ru-RU')} с {new Date(selectedBooking.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} до {new Date(selectedBooking.end_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                 </div>
              </div>
              <div className="space-y-6">
                 <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Количество участников</h4>
                    <p className="font-bold text-xl">{selectedBooking.event_attendees} человек</p>
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Текущий статус</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedBooking.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                      selectedBooking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedBooking.status}
                    </span>
                 </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-100">
               <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Описание мероприятия</h4>
               <p className="text-gray-700 whitespace-pre-wrap">{selectedBooking.event_description || 'Описание отсутствует'}</p>
            </div>

            <div className="flex gap-4">
              {selectedBooking.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'APPROVED')}
                    className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-bold hover:shadow-lg transition"
                  >
                    ✅ Одобрить заявку
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'REJECTED')}
                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:shadow-lg transition text-white"
                  >
                    ❌ Отказать
                  </button>
                </>
              )}
              {selectedBooking.status !== 'PENDING' && (
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 py-4 bg-black text-white rounded-2xl font-bold hover:shadow-lg transition"
                >
                  Закрыть
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBookingsPage
