import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHubs } from '../../api/hubs';
import Loader from '../../components/ui/Loader';

const BookSpacePage = () => {
  const navigate = useNavigate();
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния фильтров
  const [filters, setFilters] = useState({
    city: '',
  });
  
  // Список городов для фильтра
  const [cities, setCities] = useState([]);

  // Загрузка списка хабов
  useEffect(() => {
    const fetchHubs = async () => {
      setLoading(true);
      try {
        const data = await getHubs();
        setHubs(data);
        
        // Собираем уникальные города (или локации)
        const uniqueCities = [...new Set(data.map(hub => {
          // Пытаемся вытащить город из строки локации (напр. "Москва, ул. Тверская" -> "Москва")
          return hub.location.split(',')[0].trim();
        }))];
        setCities(uniqueCities);
      } catch (error) {
        console.error('Ошибка загрузки хабов:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHubs();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleHubClick = (hubId) => {
    navigate(`/hubs/${hubId}`);
  };

  const filteredHubs = filters.city 
    ? hubs.filter(hub => hub.location.startsWith(filters.city))
    : hubs;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Найти IT-хаб</h1>
          <p className="text-gray-500 text-lg">Выбирай удобное пространство для работы и общения</p>
        </div>

        {/* Фильтр по городам */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleFilterChange('city', '')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              filters.city === '' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Все города
          </button>
          {cities.map(city => (
            <button
              key={city}
              onClick={() => handleFilterChange('city', city)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                filters.city === city ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
      
      {/* Список хабов */}
      {filteredHubs.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-gray-200 py-20 text-center">
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Хабы не найдены</h3>
          <p className="text-gray-400">Попробуйте выбрать другой город или загляните позже.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredHubs.map(hub => (
            <HubCard 
              key={hub.id} 
              hub={hub} 
              onClick={() => handleHubClick(hub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HubCard = ({ hub, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
    >
      <div className="relative h-56">
        <img 
          src={hub.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600'} 
          alt={hub.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
        />
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-xs font-bold shadow-sm">
            IT-ХАБ
          </span>
        </div>
      </div>
      
      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-tbank-yellow transition-colors">
          {hub.name}
        </h3>
        <p className="text-gray-500 text-sm flex items-center gap-2 mb-6">
          📍 {hub.location}
        </p>
        <p className="text-gray-600 line-clamp-2 mb-8 leading-relaxed">
          {hub.info || 'Современное рабочее пространство с комфортными рабочими местами и высокоскоростным интернетом.'}
        </p>

        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
          <span className="text-tbank-yellow font-bold flex items-center gap-1 group-hover:gap-3 transition-all">
            Забронировать <span className="text-xl">→</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default BookSpacePage;