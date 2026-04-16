import { Link } from 'react-router-dom'

const LoginPage = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">Вход в систему</h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              placeholder="student@example.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Пароль</label>
            <input 
              type="password" 
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Войти
          </button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Нет аккаунта? <Link to="/register" className="text-tbank-yellow hover:underline">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage