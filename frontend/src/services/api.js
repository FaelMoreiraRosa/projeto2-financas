
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiRequest(endpoint, options = {}) {
  const { headers = {}, ...config } = options

  const resposta = await fetch(`${API_URL}${endpoint}`, {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
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
