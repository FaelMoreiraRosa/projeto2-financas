const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiRequest(endpoint, options = {}, token = null) {
  const { headers = {}, ...config } = options

  const cabecalhos = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`
  }

  const resposta = await fetch(`${API_URL}${endpoint}`, {
    ...config,
    headers: cabecalhos,
  })

  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    const erro = new Error(
      dados?.erro || 'Não foi possível concluir a solicitação.'
    )

    erro.status = resposta.status
    erro.campos = dados?.campos || {}

    throw erro
  }

  return dados
}
