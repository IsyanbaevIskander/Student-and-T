const DashboardPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Личный кабинет</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Мои бронирования</h3>
          <p className="text-gray-600">У вас пока нет активных бронирований</p>
        </div>
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Запросы менторам</h3>
          <p className="text-gray-600">У вас нет активных запросов</p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage