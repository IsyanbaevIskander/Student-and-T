import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-tbank-yellow">
          Студент и Т
        </Link>
        
        <div className="flex gap-6 items-center">
          <Link to="/" className="hover:text-tbank-yellow transition">Главная</Link>
          <Link to="/book-space" className="hover:text-tbank-yellow transition">Бронирование</Link>
          <Link to="/afisha" className="hover:text-tbank-yellow transition">Афиша</Link>
          <Link to="/mentors" className="hover:text-tbank-yellow transition">Менторы</Link>
          
          {isAuthenticated ? (
            <div className="flex gap-4 items-center">
              <Link to="/dashboard">
                <button className="btn-primary">
                  Личный кабинет
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 transition"
              >
                Выйти
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="btn-primary">Войти</button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header