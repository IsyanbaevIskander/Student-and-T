import { useState, useEffect } from 'react'
import { getHubs, createHub, updateHub, deleteHub } from '../../api/hubs'
import Loader from '../../components/ui/Loader'

const AdminHubsPage = () => {
  const [hubs, setHubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHub, setEditingHub] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    info: ''
  })

  useEffect(() => {
    fetchHubs()
  }, [])

  const fetchHubs = async () => {
    setLoading(true)
    try {
      const data = await getHubs()
      setHubs(data)
    } catch (error) {
      console.error('Ошибка загрузки хабов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (hub = null) => {
    if (hub) {
      setEditingHub(hub)
      setFormData({
        name: hub.name,
        location: hub.location,
        info: hub.info || ''
      })
    } else {
      setEditingHub(null)
      setFormData({ name: '', location: '', info: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      if (editingHub) {
        await updateHub(editingHub.id, formData)
      } else {
        await createHub(formData)
      }
      setIsModalOpen(false)
      fetchHubs()
    } catch (error) {
      alert('Ошибка при сохранении: ' + (error.detail || 'Неизвестная ошибка'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот хаб? Все связанные данные также будут удалены.')) {
      try {
        await deleteHub(id)
        fetchHubs()
      } catch (error) {
        alert('Ошибка при удалении')
      }
    }
  }

  if (loading) return <div className="py-20 text-center"><Loader size="lg" /></div>

  return (
    <div className="py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-1">Управление хабами</h2>
          <p className="text-gray-500 text-sm">Добавление и редактирование IT-пространств</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-black text-white font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition text-sm"
        >
          + Добавить хаб
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Название</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Локация</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hubs.map(hub => (
                <tr key={hub.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-bold text-sm">{hub.name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{hub.location}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(hub)}
                      className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-tbank-yellow hover:text-black transition"
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(hub.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {hubs.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm italic">
                    Хабы пока не добавлены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалка редактирования/создания */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl animate-scale-in">
            <h2 className="text-3xl font-bold mb-8">
              {editingHub ? 'Редактировать хаб' : 'Новый хаб'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Название</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                  placeholder="Технохаб Москва"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Локация</label>
                <input
                  required
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                  placeholder="Москва, ул. Тверская, 15"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Информация (опционально)</label>
                <textarea
                  rows="4"
                  value={formData.info}
                  onChange={e => setFormData({ ...formData, info: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-tbank-yellow transition"
                  placeholder="Опишите особенности хаба..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader size="sm" color="white" /> : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminHubsPage
