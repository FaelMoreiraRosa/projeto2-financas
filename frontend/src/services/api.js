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

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${endpoint}`, {
      ...config,
      headers: cabecalhos,
    });
  } catch {
    const erro = new Error(
      "Não foi possível conectar ao backend. Verifique se o servidor está em execução.",
    );
    erro.status = 0;
    erro.campos = {};
    throw erro;
  }

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

export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, body) => apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  }),
  put: (endpoint, body) => apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: "DELETE" }),
};
