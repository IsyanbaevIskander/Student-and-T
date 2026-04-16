import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/user/DashboardPage'
import BookSpacePage from './pages/user/BookSpacePage'
import MentorsPage from './pages/user/MentorsPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Публичные маршруты */}
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          {/* Маршруты для всех авторизованных (любой роли) */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="book-space" element={<BookSpacePage />} />
          </Route>

          {/* Маршруты ТОЛЬКО для менторов или администраторов */}
          <Route element={<ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']} />}>
            <Route path="mentors" element={<MentorsPage />} />
          </Route>

          {/* Обработка неверных путей */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App