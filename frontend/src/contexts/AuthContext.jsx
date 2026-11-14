
import { useCallback, useEffect, useState } from "react";

import { AuthContext } from "./AuthContext.js";

import {
  apiRequest,
  configurarTratamento401,
} from "../services/api";

// Recupera a sessão salva no navegador.
function recuperarSessao() {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const usuarioSalvo =
    localStorage.getItem("usuario") ||
    sessionStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch {
    localStorage.removeItem("usuario");
    sessionStorage.removeItem("usuario");
  }

  if (!token || !usuario) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");

    return {
      token: null,
      usuario: null,
    };
  }

  return {
    token,
    usuario,
  };
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(recuperarSessao);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  // Encerra a sessão e remove os dados armazenados.
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");

    setSessao({
      token: null,
      usuario: null,
    });
  }, []);

  // Registra o logout automático quando a API retornar 401.
  useEffect(() => {
    configurarTratamento401(logout);

    return () => {
      configurarTratamento401(null);
    };
  }, [logout]);

  // Valida a sessão existente no servidor.
  useEffect(() => {
    async function validarSessao() {
      if (!sessao.token) {
        setCarregandoSessao(false);
        return;
      }

      try {
        // O token é adicionado automaticamente pelo apiRequest.
        const dados = await apiRequest("/auth/perfil");

        const usuario = dados.usuario;

        const armazenamento = localStorage.getItem("token")
          ? localStorage
          : sessionStorage;

        armazenamento.setItem(
          "usuario",
          JSON.stringify(usuario),
        );

        setSessao({
          token: sessao.token,
          usuario,
        });
      } catch (erro) {
        // Só encerra a sessão se o servidor rejeitar o token.
        if (erro.status === 401) {
          logout();
        }
      } finally {
        setCarregandoSessao(false);
      }
    }

    validarSessao();
  }, [sessao.token, logout]);

  // Realiza o login.
  async function login(email, senha, manterConectado) {
    const dados = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        senha,
      }),
    });

    const armazenamento = manterConectado
      ? localStorage
      : sessionStorage;

    const outroArmazenamento = manterConectado
      ? sessionStorage
      : localStorage;

    // Remove uma sessão anterior do outro armazenamento.
    outroArmazenamento.removeItem("token");
    outroArmazenamento.removeItem("usuario");

    armazenamento.setItem("token", dados.token);

    armazenamento.setItem(
      "usuario",
      JSON.stringify(dados.usuario),
    );

    setSessao({
      token: dados.token,
      usuario: dados.usuario,
    });

    return dados.usuario;
  }

  // Realiza o cadastro.
  async function cadastrar(nome, email, cpf, senha) {
    return apiRequest("/auth/cadastro", {
      method: "POST",
      body: JSON.stringify({
        nome,
        email,
        cpf,
        senha,
      }),
    });
  }

  const valor = {
    usuario: sessao.usuario,
    token: sessao.token,
    autenticado: Boolean(sessao.token && sessao.usuario),
    carregandoSessao,
    login,
    cadastrar,
    logout,
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}
