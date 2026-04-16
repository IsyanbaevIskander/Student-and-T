import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../../api/bookings'; // Добавляем импорт
import { useAuth } from '../../hooks/useAuth'; // Добавляем импорт
import Loader from '../../components/ui/Loader';

const BookSpacePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth(); // Добавляем useAuth
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для модального окна успеха
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBookingId, setLastBookingId] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Состояния фильтров
  const [filters, setFilters] = useState({
    city: '',
    startDate: '',
    endDate: '',
    hallType: 'all',
  });
  
  // Список городов для фильтра
  const [cities, setCities] = useState([]);

  // Загрузка списка хабов
  useEffect(() => {
    const fetchHubs = async () => {
      setLoading(true);
      try {
        const data = await getHubsMock();
        setHubs(data);
        const uniqueCities = [...new Set(data.map(hub => hub.city))];
        setCities(uniqueCities);
      } catch (error) {
        console.error('Ошибка загрузки хабов:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHubs();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleHubClick = (hubId) => {
    navigate(`/hubs/${hubId}`);
  };

  // Функция для тестового бронирования (прямо со страницы списка)
  const handleTestBooking = async (hub) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/book-space' } });
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        placeName: `${hub.name}, ${hub.city}`,
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        userId: user?.id,
        status: 'pending',
        hubId: hub.id
      };
      
      const result = await createBooking(bookingData);
      setLastBookingId(result.id);
      setShowSuccessModal(true);
    } catch (error) {
      alert('Ошибка бронирования: ' + (error.message || 'Попробуйте позже'));
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredHubs = filters.city 
    ? hubs.filter(hub => hub.city === filters.city)
    : hubs;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Бронирование мест в IT-хабах</h1>
      
      {/* Блок фильтров */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Город
            </label>
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
            >
              <option value="">Все города</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата от
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата до
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип зала
            </label>
            <select
              value={filters.hallType}
              onChange={(e) => handleFilterChange('hallType', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
            >
              <option value="all">Все</option>
              <option value="individual">Для индивидуальных встреч</option>
              <option value="group">Для групповых занятий</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Список хабов */}
      {filteredHubs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Нет доступных хабов по выбранным критериям
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHubs.map(hub => (
            <HubCard 
              key={hub.id} 
              hub={hub} 
              onClick={() => handleHubClick(hub.id)}
              onTestBooking={() => handleTestBooking(hub)}
              bookingLoading={bookingLoading}
            />
          ))}
        </div>
      )}

      {/* Модальное окно успешного бронирования */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-green-600">✓ Бронирование создано!</h3>
            <p className="text-gray-600 mb-6">
              Ваше место успешно забронировано. Теперь вы можете пригласить ментора для консультации.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/mentors?bookingId=${lastBookingId}`);
                }}
                className="flex-1 bg-tbank-yellow text-black font-semibold py-2 rounded-lg hover:bg-yellow-500 transition"
              >
                Пригласить ментора
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/dashboard');
                }}
                className="flex-1 border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition"
              >
                В личный кабинет
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент карточки хаба (обновленный с кнопкой тестового бронирования)
const HubCard = ({ hub, onClick, onTestBooking, bookingLoading }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
      {hub.image && (
        <img 
          src={hub.image} 
          alt={hub.name}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={onClick}
        />
      )}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold cursor-pointer hover:text-tbank-yellow" onClick={onClick}>
            {hub.name}
          </h3>
          <span className="text-sm text-gray-500">{hub.city}</span>
        </div>
        <p className="text-gray-600 mb-3 line-clamp-2">{hub.description}</p>
        <div className="flex justify-between items-center text-sm">
          <div className="flex gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              🖥️ {hub.individualSpaces} мест
            </span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              👥 {hub.groupSpaces} залов
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onClick}
              className="text-tbank-yellow font-semibold hover:underline"
            >
              Подробнее →
            </button>
            <button
              onClick={onTestBooking}
              disabled={bookingLoading}
              className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition disabled:opacity-50"
            >
              {bookingLoading ? '...' : 'Тест-бронь'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Временная заглушка для демонстрации
const getHubsMock = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    {
      id: 1,
      name: 'Технохаб Москва',
      city: 'Москва',
      address: 'ул. Тверская, 15',
      description: 'Современный IT-хаб с зонами для коворкинга, переговорными и местами для индивидуальной работы.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
      individualSpaces: 24,
      groupSpaces: 3,
    },
    {
      id: 2,
      name: 'Цифровое пространство',
      city: 'Санкт-Петербург',
      address: 'Невский пр., 88',
      description: 'Пространство для IT-специалистов с зонами для командной работы и тихими местами для фокуса.',
      image: 'https://images.unsplash.com/photo-1497366811353-687f4e18c2c1?w=400',
      individualSpaces: 16,
      groupSpaces: 2,
    },
    {
      id: 3,
      name: 'Иннополис Хаб',
      city: 'Казань',
      address: 'ул. Баумана, 42',
      description: 'Хаб в центре города с современным оборудованием и зонами для менторских сессий.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
      individualSpaces: 20,
      groupSpaces: 4,
    },
    {
      id: 4,
      name: 'Технопарк Новосибирск',
      city: 'Новосибирск',
      address: 'Красный пр., 220',
      description: 'Крупный технопарк с IT-кластерами и переговорными комнатами.',
      image: 'https://images.unsplash.com/photo-1497366754035-f2001a3e62e1?w=400',
      individualSpaces: 30,
      groupSpaces: 5,
    },
  ];
};

export default BookSpacePage;