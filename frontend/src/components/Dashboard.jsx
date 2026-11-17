
import { useState } from 'react'
import { useAuth } from '../contexts/useAuth'
import Categorias from './Categorias'
import './Dashboard.css'

function Dashboard() {
  const { usuario, logout } = useAuth()
  const [pagina, setPagina] = useState('inicio')

  const menu = [
    { id: 'inicio', nome: 'Visão geral', icone: '⌂' },
    { id: 'categorias', nome: 'Categorias', icone: '▦' },
    { id: 'fontes', nome: 'Fontes e destinos', icone: '⇄' },
    { id: 'relatorios', nome: 'Relatórios', icone: '▤' },
  ]

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <span className="dashboard-logo-icon">₿</span>
          <div>
            <strong>FinanceApp</strong>
            <small>Controle financeiro</small>
          </div>
        </div>

        <span className="dashboard-menu-titulo">MENU PRINCIPAL</span>

        <nav className="dashboard-menu">
          {menu.map((item) => (
            <button
              key={item.id}
              className={pagina === item.id ? 'ativo' : ''}
              onClick={() => setPagina(item.id)}
            >
              <span>{item.icone}</span>
              {item.nome}
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-rodape">
          <span>Conectado como</span>
          <strong>{usuario?.nome || 'Usuário'}</strong>
          <button onClick={logout}>Sair da conta</button>
        </div>
      </aside>

      <div className="dashboard-principal">
        <header className="dashboard-topo">
          <div>
            <span>ÁREA FINANCEIRA</span>
            <h1>
              {menu.find((item) => item.id === pagina)?.nome}
            </h1>
          </div>
          <div className="dashboard-avatar">
            {(usuario?.nome || 'U').charAt(0).toUpperCase()}
          </div>
        </header>

        {pagina === 'inicio' && (
          <main className="dashboard-conteudo">
            <section className="dashboard-boas-vindas">
              <div>
                <span>SEU CONTROLE FINANCEIRO</span>
                <h2>Bem-vindo(a), {usuario?.nome || 'usuário'}!</h2>
                <p>
                  Organize suas finanças e acompanhe suas movimentações
                  em um só lugar.
                </p>
              </div>
              <span className="dashboard-boas-vindas-icone">✦</span>
            </section>

            <section className="dashboard-cards">
              <article>
                <span>Organização</span>
                <strong>Categorias</strong>
                <p>Classifique suas entradas e saídas.</p>
                <button onClick={() => setPagina('categorias')}>
                  Acessar categorias →
                </button>
              </article>

              <article>
                <span>Gerenciamento</span>
                <strong>Fontes e destinos</strong>
                <p>Cadastre contas, rendas e cartões.</p>
                <button onClick={() => setPagina('fontes')}>
                  Acessar cadastros →
                </button>
              </article>

              <article>
                <span>Acompanhamento</span>
                <strong>Relatórios</strong>
                <p>Visualize informações das suas finanças.</p>
                <button onClick={() => setPagina('relatorios')}>
                  Ver relatórios →
                </button>
              </article>
            </section>
          </main>
        )}

        {pagina === 'categorias' && <Categorias />}

        {pagina === 'fontes' && (
          <main className="dashboard-em-construcao">
            <h2>Fontes e destinos</h2>
            <p>Esta área será conectada na próxima etapa.</p>
          </main>
        )}

        {pagina === 'relatorios' && (
          <main className="dashboard-em-construcao">
            <h2>Relatórios financeiros</h2>
            <p>Esta área será conectada na próxima etapa.</p>
          </main>
        )}
      </div>
    </div>
  )
}

export default Dashboard
