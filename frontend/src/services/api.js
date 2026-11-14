const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Função registrada pelo AuthContext para encerrar sessões inválidas.
let aoReceberUnauthorized = null;

export function configurarTratamento401(callback) {
  aoReceberUnauthorized = callback;
}

export async function apiRequest(endpoint, options = {}) {
  const { headers = {}, ...config } = options;

  // Recupera automaticamente o token salvo.
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const cabecalhos = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_URL}${endpoint}`, {
    ...config,
    headers: cabecalhos,
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = new Error(
      dados?.erro || "Não foi possível concluir a solicitação.",
    );

    erro.status = resposta.status;
    erro.campos = dados?.campos || {};

    // Token inválido, expirado ou não autorizado.
    const rotaPublica =
      endpoint === "/auth/login" || endpoint === "/auth/cadastro";

    if (resposta.status === 401 && !rotaPublica && aoReceberUnauthorized) {
      aoReceberUnauthorized();
    }

    throw erro;
  }

  return dados;
}
