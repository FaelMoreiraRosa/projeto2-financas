
import { useState } from 'react'
import { AuthContext } from './AuthContext.js'
import { apiRequest } from '../services/api'

function recuperarSessao() {
  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token')

  const usuarioSalvo =
    localStorage.getItem('usuario') || sessionStorage.getItem('usuario')

  let usuario = null

  try {
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null
  } catch {
    localStorage.removeItem('usuario')
    sessionStorage.removeItem('usuario')
  }

  return { token, usuario }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(recuperarSessao)

  async function login(email, senha, manterConectado) {
    const dados = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    })

    const armazenamento = manterConectado ? localStorage : sessionStorage
    const outroArmazenamento = manterConectado
      ? sessionStorage
      : localStorage

    outroArmazenamento.removeItem('token')
    outroArmazenamento.removeItem('usuario')

    armazenamento.setItem('token', dados.token)
    armazenamento.setItem('usuario', JSON.stringify(dados.usuario))

    setSessao({
      token: dados.token,
      usuario: dados.usuario,
    })

    return dados.usuario
  }

  async function cadastrar(nome, email, cpf, senha) {
    return apiRequest('/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify({ nome, email, cpf, senha }),
    })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')

    setSessao({
      token: null,
      usuario: null,
    })
  }

  const valor = {
    usuario: sessao.usuario,
    token: sessao.token,
    autenticado: Boolean(sessao.token),
    login,
    cadastrar,
    logout,
  }

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  )
}
