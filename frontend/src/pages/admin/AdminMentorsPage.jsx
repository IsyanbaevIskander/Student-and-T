import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, User, Briefcase, Mail, MapPin, Search } from 'lucide-react'
import { getPendingMentorApplications, approveMentorApplication, rejectMentorApplication } from '../../api/mentors'
import Loader from '../../components/ui/Loader'

const AdminMentorsPage = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const data = await getPendingMentorApplications()
      setApplications(data)
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleApprove = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите одобрить это приложение? Пользователь станет ментором.')) return
    
    setProcessingId(userId)
    try {
      await approveMentorApplication(userId)
      setApplications(applications.filter(app => app.user_id !== userId))
      alert('Заявка одобрена!')
    } catch (error) {
      alert('Ошибка при одобрении: ' + (error.detail || 'Неизвестная ошибка'))
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите отклонить эту заявку?')) return
    
    setProcessingId(userId)
    try {
      await rejectMentorApplication(userId)
      setApplications(applications.filter(app => app.user_id !== userId))
      alert('Заявка отклонена')
    } catch (error) {
      alert('Ошибка при отклонении: ' + (error.detail || 'Неизвестная ошибка'))
    } finally {
      setProcessingId(null)
    }
  }

  const filteredApplications = applications.filter(app => 
    (app.user_email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (app.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (app.last_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader size="lg" text="Загрузка заявок..." />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Заявки на менторство</h2>
          <p className="text-gray-500">Проверка и подтверждение новых менторов в системе</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по email или имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-tbank-yellow/50 transition"
          />
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-gray-200" />
          </div>
          <p className="text-gray-500 font-bold">Заявок не найдено</p>
          <p className="text-sm text-gray-400 mt-2">
            {searchQuery ? 'Попробуйте изменить параметры поиска' : 'На данный момент новых заявок нет'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredApplications.map((app) => (
            <div 
              key={app.user_id} 
              className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row justify-between gap-8"
            >
              <div className="flex-grow space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-tbank-yellow to-yellow-500 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-lg">
                    {(app.first_name || app.user_email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {app.first_name} {app.last_name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <Mail className="w-3 h-3" /> {app.user_email}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-tbank-yellow uppercase tracking-widest">
                        <MapPin className="w-3 h-3" /> Хаб #{app.hub_id}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0 w-full lg:w-48 self-center">
                <button
                  onClick={() => handleApprove(app.user_id)}
                  disabled={processingId === app.user_id}
                  className="flex-1 px-6 py-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition shadow-lg shadow-green-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === app.user_id ? <Loader size="sm" color="white" /> : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Одобрить
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(app.user_id)}
                  disabled={processingId === app.user_id}
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
  )
}

export default AdminMentorsPage
