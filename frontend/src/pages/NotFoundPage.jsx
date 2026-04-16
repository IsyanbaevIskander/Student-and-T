import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-6xl font-bold bg-gradient-to-r from-tbank-yellow to-yellow-500 bg-clip-text text-transparent mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Страница не найдена</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Кажется, вы пытаетесь получить доступ к странице, которая не существует, или у вас нет прав для её просмотра.
      </p>
      <Link 
        to="/" 
        className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition"
      >
        Вернуться на главную
      </Link>
    </div>
  )
}

export default NotFoundPage
