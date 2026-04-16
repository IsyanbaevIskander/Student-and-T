const MentorsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Наши менторы</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="card">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full mr-4"></div>
              <div>
                <h3 className="text-xl font-bold">Алексей Иванов</h3>
                <p className="text-gray-600">Senior Developer</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Эксперт в React, Python и FastAPI. Помогу с архитектурой приложений.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-gray-200 px-2 py-1 rounded text-sm">React</span>
              <span className="bg-gray-200 px-2 py-1 rounded text-sm">Python</span>
              <span className="bg-gray-200 px-2 py-1 rounded text-sm">FastAPI</span>
            </div>
            <button className="btn-primary w-full">Запросить менторство</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MentorsPage