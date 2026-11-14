import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

function ProtectedRoute() {
  const { autenticado, carregandoSessao } = useAuth()

  if (carregandoSessao) {
    return <p>Carregando sua sessão...</p>
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
