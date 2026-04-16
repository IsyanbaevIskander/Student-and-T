import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const HomePage = () => {
  // Анимированная статистика (для красоты)
  const [stats, setStats] = useState({
    hubs: 0,
    bookings: 0,
    mentors: 0
  })

  const targetStats = {
    hubs: 15,
    bookings: 1247,
    mentors: 45
  }

  useEffect(() => {
    // Анимация увеличения чисел
    const duration = 2000 // 2 секунды
    const stepTime = 20 // шаг каждые 20мс
    const steps = duration / stepTime
    
    let currentStep = 0
    
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      
      setStats({
        hubs: Math.floor(targetStats.hubs * progress),
        bookings: Math.floor(targetStats.bookings * progress),
        mentors: Math.floor(targetStats.mentors * progress)
      })
      
      if (currentStep >= steps) {
        setStats(targetStats)
        clearInterval(interval)
      }
    }, stepTime)
    
    return () => clearInterval(interval)
  }, [])

  // Список IT-хабов для отображения
  const featuredHubs = [
    {
      name: 'Технохаб Москва',
      location: 'Москва, ул. Тверская, 15',
      description: 'Современный IT-хаб с зонами для коворкинга и переговорными',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
      features: ['24 места', '3 групповых зала', 'Wi-Fi', 'Кофе-поинт']
    },
    {
      name: 'Цифровое пространство',
      location: 'Санкт-Петербург, Невский пр., 88',
      description: 'Пространство для IT-специалистов с зонами для командной работы',
      image: 'https://images.unsplash.com/photo-1497366811353-687f4e18c2c1?w=400',
      features: ['16 мест', '2 групповых зала', 'Принтер', 'Кухня']
    },
    {
      name: 'Иннополис Хаб',
      location: 'Казань, ул. Баумана, 42',
      description: 'Хаб в центре города с современным оборудованием',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
      features: ['20 мест', '4 групповых зала', 'Проектор', 'Доска']
    }
  ]

  return (
    <div>
      {/* Hero секция */}
      <div className="bg-gradient-to-r from-tbank-yellow to-yellow-600 text-black py-20 mx-4 rounded-2xl mt-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">Студент и Т</h1>
          <p className="text-xl mb-8">Рабочие пространства и менторство от Т-Технологии</p>
          <Link to="/book-space">
            <button className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition transform hover:scale-105">
              Начать работу
            </button>
          </Link>
        </div>
      </div>

      {/* Блок статистики */}
      <div className="bg-gray-900 text-white py-16 mt-8">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Т-Технологии в цифрах</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="transform hover:scale-105 transition">
              <div className="text-5xl font-bold text-tbank-yellow mb-2">{stats.hubs}+</div>
              <div className="text-lg">IT-хабов по всей России</div>
              <div className="text-sm text-gray-400 mt-2">В 12 городах присутствия</div>
            </div>
            <div className="transform hover:scale-105 transition">
              <div className="text-5xl font-bold text-tbank-yellow mb-2">{stats.bookings}+</div>
              <div className="text-lg">Успешных бронирований</div>
              <div className="text-sm text-gray-400 mt-2">Студентами вузов-партнёров</div>
            </div>
            <div className="transform hover:scale-105 transition">
              <div className="text-5xl font-bold text-tbank-yellow mb-2">{stats.mentors}+</div>
              <div className="text-lg">Опытных менторов</div>
              <div className="text-sm text-gray-400 mt-2">Готовы поделиться знаниями</div>
            </div>
          </div>
        </div>
      </div>

      {/* Расширенные преимущества */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Почему выбирают нас</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="text-xl font-bold mb-3">Современные хаб-ы</h3>
            <p className="text-gray-600 mb-4">Доступ к IT-инфраструктуре компании в твоём городе. Современное оборудование, высокоскоростной интернет и комфортные зоны для работы.</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>✓ 24/7 доступ в хабы</li>
              <li>✓ Эргономичные рабочие места</li>
              <li>✓ Переговорные комнаты</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="text-5xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-bold mb-3">Менторство</h3>
            <p className="text-gray-600 mb-4">Помощь от опытных сотрудников Т-Технологии. Реальные проекты, карьерные консультации и поддержка в обучении.</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>✓ 45+ активных менторов</li>
              <li>✓ 8+ лет средний опыт</li>
              <li>✓ Индивидуальный подход</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="text-5xl mb-4">💻</div>
            <h3 className="text-xl font-bold mb-3">Удобное бронирование</h3>
            <p className="text-gray-600 mb-4">Бронируй рабочие места и групповые залы в несколько кликов. Выбирай удобное время и получай подтверждение мгновенно.</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>✓ Бесплатно для студентов</li>
              <li>✓ Онлайн-бронирование</li>
              <li>✓ Приглашение менторов</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Популярные IT-хабы */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Популярные IT-хабы</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredHubs.map((hub, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1">
                <img 
                  src={hub.image} 
                  alt={hub.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{hub.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">📍 {hub.location}</p>
                  <p className="text-gray-600 mb-4">{hub.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hub.features.map((feature, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <Link to="/book-space">
                    <button className="w-full bg-tbank-yellow text-black font-semibold py-2 rounded-lg hover:bg-yellow-500 transition">
                      Забронировать
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/book-space">
              <button className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition">
                Смотреть все хабы →
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Призыв к действию */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-tbank-yellow to-yellow-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Готов начать?</h2>
          <p className="text-lg mb-8">Присоединяйся к сообществу студентов и менторов Т-Технологии</p>
          <Link to="/register">
            <button className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition transform hover:scale-105">
              Зарегистрироваться
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage