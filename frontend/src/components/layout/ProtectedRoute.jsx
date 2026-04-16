import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Защищенный маршрут
 * @param {Object} props
 * @param {Array<string>} [props.allowedRoles] - Массив допустимых ролей (например: ['ADMIN', 'MENTOR']). Если пусто, доступно всем авторизованным.
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Пока данные загружаются, можно показать скелетон или лоадер
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tbank-yellow"></div>
      </div>
    )
  }

  // Если не авторизован - редирект на логин, при этом запоминаем страницу, куда он пытался зайти
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Ролевая проверка (если компонент требует 특정ную роль, а у юзера её нет)
  if (allowedRoles.length > 0 && (!user || !user.role || !allowedRoles.includes(user.role))) {
    // В ответ на требование "Ограничить ли доступ на mentors... пусть будет 404" 
    // Вместо редиректа 'назад' мы рендерим 'переход на /404' либо можно возвращать NotFound прямо тут, но редирект чище.
    return <Navigate to="/404" replace />
  }

  // Иначе всё ок - рендерим дочерние элементы маршрута (содержимое страницы)
  return <Outlet />
}

export default ProtectedRoute
