import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirmation: '',
    firstName: '',
    lastName: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Очищаем ошибку при изменении полей
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Валидация
    if (!formData.email || !formData.password || !formData.passwordConfirmation) {
      setError('Заполните все обязательные поля')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError('Пароли не совпадают')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      setIsLoading(false)
      return
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      passwordConfirmation: formData.passwordConfirmation,
      firstName: formData.firstName,
      lastName: formData.lastName,
    })
    
    if (result.success) {
      navigate('/dashboard') // После регистрации в личный кабинет
    } else {
      setError(result.error || 'Ошибка регистрации')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Регистрация</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Имя (необязательно)</label>
            <input 
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              placeholder="Иван"
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Фамилия (необязательно)</label>
            <input 
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              placeholder="Иванов"
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email *</label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              placeholder="student@example.com"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Пароль *</label>
            <input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Подтвердите пароль *</label>
            <input 
              type="password"
              name="passwordConfirmation"
              value={formData.passwordConfirmation}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-tbank-yellow"
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-tbank-yellow text-black font-semibold py-2 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <p className="text-center mt-4 text-gray-600">
          Уже есть аккаунт? <Link to="/login" className="text-tbank-yellow hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage