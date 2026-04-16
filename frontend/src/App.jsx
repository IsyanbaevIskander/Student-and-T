import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/user/DashboardPage'
import BookSpacePage from './pages/user/BookSpacePage'
import MentorsPage from './pages/user/MentorsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="book-space" element={<BookSpacePage />} />
        <Route path="mentors" element={<MentorsPage />} />
      </Route>
    </Routes>
  )
}

export default App