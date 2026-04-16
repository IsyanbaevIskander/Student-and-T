import { useState } from 'react'

const BookSpacePage = () => {
  const [selectedDate, setSelectedDate] = useState('')
  const [hallType, setHallType] = useState('individual')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Бронирование пространства</h1>
      
      <div className="card mb-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Дата</label>
            <input 
              type="date" 
              className="w-full border rounded-lg px-3 py-2"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Тип зала</label>
            <select 
              className="w-full border rounded-lg px-3 py-2"
              value={hallType}
              onChange={(e) => setHallType(e.target.value)}
            >
              <option value="individual">Индивидуальные места</option>
              <option value="group">Групповые залы</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full">Поиск</button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="card">
            <h3 className="text-xl font-bold mb-2">Хаб "Технополис"</h3>
            <p className="text-gray-600 mb-2">ул. Ленина, 10</p>
            <p className="text-gray-600 mb-4">Доступно мест: 8</p>
            <button className="btn-primary">Выбрать</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BookSpacePage