import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/user/DashboardPage'
import BookSpacePage from './pages/user/BookSpacePage'
import HubDetailPage from './pages/user/HubDetailPage'
import AdminHubsPage from './pages/admin/AdminHubsPage'
import MentorsPage from './pages/user/MentorsPage'
import AfishaPage from './pages/events/AfishaPage'
import JoinEventPage from './pages/events/JoinEventPage'
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
          <Route path="afisha" element={<AfishaPage />} />
          
          {/* Маршруты для всех авторизованных (любой роли) */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="book-space" element={<BookSpacePage />} />
            <Route path="hubs/:id" element={<HubDetailPage />} />
            <Route path="events/join/:code" element={<JoinEventPage />} />
            
            {/* Админские маршруты */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="admin/hubs" element={<AdminHubsPage />} />
            </Route>
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