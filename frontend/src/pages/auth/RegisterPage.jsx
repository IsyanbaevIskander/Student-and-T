import { Link } from 'react-router-dom'

const RegisterPage = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">Регистрация</h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input type="email" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Пароль</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Подтвердите пароль</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Зарегистрироваться
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