import { Navigate, Route, Routes } from 'react-router-dom'

import AuthPage from './components/pages/AuthPage'
import DashboardPage from './components/pages/DashboardPage'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={<AuthPage key="login" initialMode="login" />}
      />

      <Route
        path="/cadastro"
        element={<AuthPage key="cadastro" initialMode="cadastro" />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
