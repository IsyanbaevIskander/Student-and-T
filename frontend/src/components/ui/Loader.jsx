/**
 * Компонент спиннера загрузки
 * @param {string} size - размер спиннера ('sm', 'md', 'lg')
 * @param {string} color - цвет спиннера ('yellow', 'white', 'gray')
 * @param {boolean} fullScreen - на весь экран
 * @param {string} text - текст под спиннером
 * @param {string} className - дополнительные CSS классы
 */

const Loader = ({ 
  size = 'md', 
  color = 'yellow', 
  fullScreen = false, 
  text = '',
  className = ''
}) => {
  
  // Размеры спиннера
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };
  
  // Цвета спиннера
  const colorClasses = {
    yellow: 'border-tbank-yellow',
    white: 'border-white',
    gray: 'border-gray-500',
  };
  
  // Цвет текста в зависимости от цвета спиннера
  const textColorClasses = {
    yellow: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-500',
  };
  
  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          border-t-transparent 
          border-solid 
          rounded-full 
          animate-spin
        `}
      />
      {text && (
        <p className={`mt-3 text-sm ${textColorClasses[color]}`}>
          {text}
        </p>
      )}
    </div>
  );
  
  // Если нужен fullScreen - оборачиваем в фиксированный контейнер
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          {spinnerElement}
        </div>
      </div>
    );
  }
  
  return spinnerElement;
};

// Компонент для загрузки контента (скелетон)
export const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const skeletons = Array(count).fill(null);
  
  const getSkeletonClass = () => {
    switch (type) {
      case 'card':
        return 'bg-gray-200 rounded-xl h-64 animate-pulse';
      case 'list':
        return 'bg-gray-200 rounded-lg h-16 animate-pulse';
      case 'text':
        return 'bg-gray-200 rounded h-4 animate-pulse';
      case 'avatar':
        return 'bg-gray-200 rounded-full w-12 h-12 animate-pulse';
      default:
        return 'bg-gray-200 rounded-lg h-32 animate-pulse';
    }
  };
  
  return (
    <div className="space-y-4">
      {skeletons.map((_, index) => (
        <div key={index} className={getSkeletonClass()} />
      ))}
    </div>
  );
};

// Компонент-обёртка для отложенной загрузки (lazy loading)
export const SuspenseLoader = () => {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <Loader size="lg" text="Загрузка..." />
    </div>
  );
};

export default Loader;