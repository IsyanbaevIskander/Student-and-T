import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Простая валидация
    if (!email || !password) {
      setError('Заполните все поля')
      setIsLoading(false)
      return
    }

    const result = await login(email, password)
    
    if (result.success) {
      navigate('/dashboard') // После входа в личный кабинет
    } else {
      setError(result.error || 'Неверный email или пароль')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Вход в систему</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              placeholder="student@example.com"
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Пароль</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-tbank-yellow text-black font-semibold py-2 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
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