import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div>
      {/* Hero секция */}
      <div className="bg-gradient-to-r from-tbank-yellow to-yellow-600 text-black py-20 mx-4 rounded-2xl mt-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">Студент и Т</h1>
          <p className="text-xl mb-8">Рабочие пространства и менторство от Т-Технологии</p>
          <Link to="/book-space">
            <button className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition">
              Начать работу
            </button>
          </Link>
        </div>
      </div>

      {/* Преимущества */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card">
            {/* <div className="text-4xl mb-4">🚀</div> */}
            <h3 className="text-xl font-bold mb-3">Современные хаб-ы</h3>
            <p className="text-gray-600">Доступ к IT-инфраструктуре компании в твоём городе</p>
          </div>
          <div className="card">
            {/* <div className="text-4xl mb-4">👨‍🏫</div> */}
            <h3 className="text-xl font-bold mb-3">Менторство</h3>
            <p className="text-gray-600">Помощь от опытных сотрудников Т-Технологии</p>
          </div>
          <div className="card">
            {/* <div className="text-4xl mb-4">💻</div> */}
            <h3 className="text-xl font-bold mb-3">Удобное бронирование</h3>
            <p className="text-gray-600">Бронируй рабочие места и групповые залы</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage