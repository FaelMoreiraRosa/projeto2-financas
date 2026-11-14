
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

function DashboardPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main>
      <h1>Bem-vindo ao Finance!</h1>

      <p>
        Olá, {usuario?.nome}! Você está autenticado.
      </p>

      <p>
        Esta será a página principal do seu controle financeiro.
      </p>

      <button type="button" onClick={handleLogout}>
        Sair da conta
      </button>
    </main>
  )
}

export default DashboardPage
