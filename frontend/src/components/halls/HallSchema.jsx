import { useState } from 'react'

/**
 * Компонент отображения схемы зала с местами
 * @param {Object} hall - объект зала
 * @param {Array} places - массив мест
 * @param {Function} onSelectPlace - колбэк при выборе места
 */

const HallSchema = ({ hall, places, onSelectPlace }) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)

  // Получаем размеры сетки (максимальные x и y)
  const maxX = Math.max(...places.map(p => p.x || 0))
  const maxY = Math.max(...places.map(p => p.y || 0))
  
  const gridCols = maxX + 1
  const gridRows = maxY + 1

  // Статусы мест с цветами и иконками
  const getPlaceStatus = (status) => {
    switch (status) {
      case 'available':
        return {
          bgColor: 'bg-green-100 hover:bg-green-200',
          borderColor: 'border-green-400',
          textColor: 'text-green-700',
          icon: '✓',
          title: 'Свободно'
        }
      case 'booked':
        return {
          bgColor: 'bg-red-100 cursor-not-allowed',
          borderColor: 'border-red-400',
          textColor: 'text-red-700',
          icon: '✕',
          title: 'Занято'
        }
      case 'selected':
        return {
          bgColor: 'bg-tbank-yellow',
          borderColor: 'border-yellow-600',
          textColor: 'text-black',
          icon: '✓',
          title: 'Выбрано'
        }
      case 'maintenance':
        return {
          bgColor: 'bg-gray-200 cursor-not-allowed',
          borderColor: 'border-gray-400',
          textColor: 'text-gray-500',
          icon: '🔧',
          title: 'На обслуживании'
        }
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-700',
          icon: '?',
          title: 'Неизвестно'
        }
    }
  }

  const handlePlaceClick = (place) => {
    if (place.status === 'available') {
      setSelectedPlaceId(place.id)
      onSelectPlace(place)
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Схема зала "{hall.name}"</h3>
      
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
          <span>Свободно</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-400 rounded"></div>
          <span>Занято</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
          <span>Обслуживание</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-tbank-yellow border border-yellow-600 rounded"></div>
          <span>Выбрано</span>
        </div>
      </div>

      <div 
        className="grid gap-3 p-4 bg-white rounded-lg border"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(80px, 100px))`,
          justifyContent: 'center'
        }}
      >
        {places.map((place) => {
          const status = getPlaceStatus(place.status)
          return (
            <div
              key={place.id}
              onClick={() => handlePlaceClick(place)}
              className={`
                relative p-3 border-2 rounded-lg text-center cursor-pointer
                transition-all duration-200 hover:shadow-md
                ${status.bgColor} ${status.borderColor}
                ${place.status !== 'available' ? 'opacity-60' : ''}
              `}
              title={status.title}
            >
              <div className={`font-semibold ${status.textColor}`}>
                {place.number}
              </div>
              <div className="text-xs mt-1">
                {place.hasPc && '🖥️ '}
                {place.hasMonitor && '🖥️ '}
              </div>
              {place.status === 'selected' && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                  ✓
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        🖥️ - наличие компьютера или монитора
      </div>
    </div>
  )
}

export default HallSchema