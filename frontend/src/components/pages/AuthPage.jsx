
import { useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../contexts/useAuth";
import "./AuthPage.css";

function AuthPage({ initialMode = "login" }) {
  const { login, cadastrar, autenticado, carregandoSessao } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [modo, setModo] = useState(initialMode);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [mensagem, setMensagem] = useState(
    location.state?.mensagem || "",
  );

  const [tipoMensagem, setTipoMensagem] = useState(
    location.state?.tipoMensagem || "",
  );

  const [carregando, setCarregando] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [manterConectado, setManterConectado] = useState(false);

  const estaNoCadastro = modo === "cadastro";

  function alternarModo(novoModo) {
    setModo(novoModo);
    setMensagem("");
    setTipoMensagem("");
    setSenha("");

    navigate(novoModo === "cadastro" ? "/cadastro" : "/login", {
      replace: true,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMensagem("");
    setTipoMensagem("");
    setCarregando(true);

    try {
      if (estaNoCadastro) {
        await cadastrar(nome, email, cpf, senha);

        navigate("/login", {
          replace: true,
          state: {
            mensagem: "Conta criada com sucesso! Agora você pode entrar.",
            tipoMensagem: "sucesso",
          },
        });
      } else {
        await login(email, senha, manterConectado);

        setSenha("");

        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (erro) {
      setMensagem(erro.message);
      setTipoMensagem("erro");
    } finally {
      setCarregando(false);
    }
  }

  if (carregandoSessao) {
    return <p>Carregando sua sessão...</p>;
  }

  if (autenticado) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="brand">
          <div className="brand-icon">F</div>
          <span>finance</span>
        </div>

        <div className="showcase-content">
          <span className="eyebrow">
            SUA VIDA FINANCEIRA, ORGANIZADA
          </span>

          <h1>
            Tenha o controle.
            <br />
            <span>Conquiste seus planos.</span>
          </h1>

          <p>
            Organize suas receitas, acompanhe suas despesas e tenha mais clareza
            sobre o seu dinheiro.
          </p>

          <div className="showcase-card">
            <div className="showcase-card-header">
              <span>Visão financeira</span>
              <span className="status-dot">●</span>
            </div>

            <div className="showcase-card-value">R$ 4.250,00</div>

            <span className="showcase-card-caption">
              Exemplo ilustrativo de saldo
            </span>

            <div className="showcase-chart">
              {[35, 52, 42, 68, 55, 82, 70, 95, 75, 100, 85, 110].map(
                (altura, index) => (
                  <div
                    className="chart-bar"
                    style={{ height: `${altura}px` }}
                    key={index}
                  />
                ),
              )}
            </div>
          </div>
        </div>

        <span className="showcase-footer">
          Organização hoje. Tranquilidade amanhã.
        </span>
      </section>

      <section className="auth-content">
        <div className="auth-form-container">
          <div className="mobile-brand">
            <div className="brand-icon">F</div>
            <span>finance</span>
          </div>

          <div className="auth-heading">
            <span className="eyebrow">
              {estaNoCadastro ? "COMECE AGORA" : "BEM-VINDO DE VOLTA"}
            </span>

            <h2>
              {estaNoCadastro ? "Crie sua conta" : "Entre na sua conta"}
            </h2>

            <p>
              {estaNoCadastro
                ? "Preencha seus dados para começar."
                : "Informe seus dados para acessar sua conta."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={!estaNoCadastro ? "active" : ""}
              onClick={() => alternarModo("login")}
              disabled={carregando}
            >
              Entrar
            </button>

            <button
              type="button"
              className={estaNoCadastro ? "active" : ""}
              onClick={() => alternarModo("cadastro")}
              disabled={carregando}
            >
              Criar conta
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {estaNoCadastro && (
              <>
                <div className="form-group">
                  <label htmlFor="nome">Nome completo</label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cpf">CPF</label>
                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    placeholder="Somente números ou com pontuação"
                    autoComplete="off"
                    value={cpf}
                    onChange={(event) => setCpf(event.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="senha">Senha</label>

              <div className="password-wrapper">
                <input
                  id="senha"
                  name="senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete={
                    estaNoCadastro ? "new-password" : "current-password"
                  }
                  minLength={8}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {!estaNoCadastro && (
              <div className="form-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={manterConectado}
                    onChange={(event) =>
                      setManterConectado(event.target.checked)
                    }
                  />
                  <span>Manter conectado</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={carregando}
            >
              {carregando
                ? "Aguarde..."
                : estaNoCadastro
                  ? "Criar minha conta"
                  : "Entrar"}

              {!carregando && <span aria-hidden="true">→</span>}
            </button>

            {mensagem && (
              <p
                className="form-feedback"
                role="status"
                aria-live="polite"
                data-tipo={tipoMensagem}
              >
                {mensagem}
              </p>
            )}
          </form>

          <p className="auth-switch">
            {estaNoCadastro
              ? "Já possui uma conta?"
              : "Ainda não tem uma conta?"}{" "}
            <button
              type="button"
              disabled={carregando}
              onClick={() =>
                alternarModo(estaNoCadastro ? "login" : "cadastro")
              }
            >
              {estaNoCadastro ? "Faça login" : "Cadastre-se"}
            </button>
          </p>

          <span className="auth-legal">
            Finance · Controle financeiro pessoal
          </span>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
