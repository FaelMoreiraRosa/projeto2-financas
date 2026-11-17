import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import Dashboard from '../Dashboard'
import Lancamentos from '../Lancamentos'
import Faturas from '../Faturas'
import Categorias from '../Categorias'
import FontesDestinos from '../FontesDestinos'
import RelatoriosCategorias from '../RelatoriosCategorias'
import RelatoriosFontesDestinos from '../RelatoriosFontesDestinos'
import '../../styles.css'

const paginas = [
  { id: 'inicio', nome: 'Visão geral', marca: '01' },
  { id: 'lancamentos', nome: 'Lançamentos', marca: '02' },
  { id: 'faturas', nome: 'Faturas', marca: '03' },
  { id: 'categorias', nome: 'Categorias', marca: '04' },
  { id: 'fontes', nome: 'Fontes e destinos', marca: '05' },
  { id: 'relatorios', nome: 'Relatórios', marca: '06' },
]

export default function FinanceDashboard() {
  const [pagina, setPagina] = useState('inicio')
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const conteudo = pagina === 'lancamentos'
    ? <Lancamentos />
    : pagina === 'faturas'
      ? <Faturas />
      : pagina === 'categorias'
        ? <Categorias />
        : pagina === 'fontes'
          ? <FontesDestinos />
          : pagina === 'relatorios'
            ? <div className="page-stack"><RelatoriosCategorias /><RelatoriosFontesDestinos /></div>
            : <Dashboard />

  function sair() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="finance-app">
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); setPagina('inicio') }}>
            <span className="brand-mark" aria-hidden="true"><span>F</span></span>
            <span><strong>Finanças</strong><small>controle pessoal</small></span>
          </a>

          <div className="sidebar-section-label">Seu espaço</div>
          <nav className="primary-nav" aria-label="Navegação financeira">
            {paginas.map((item) => (
              <button type="button" key={item.id} className={pagina === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setPagina(item.id)} aria-current={pagina === item.id ? 'page' : undefined}>
                <span className="nav-number">{item.marca}</span><span>{item.nome}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <span className="sidebar-rule" />
            <span className="status-dot" />
            <span>Dados protegidos por usuário</span>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <span className="breadcrumb">Controle financeiro <span>/</span> {paginas.find((item) => item.id === pagina)?.nome}</span>
            <div className="account-controls">
              <span className="topbar-date">{usuario?.nome}</span>
              <button className="text-button" type="button" onClick={sair}>Sair</button>
            </div>
          </header>

          <div className="content-area" key={pagina}>{conteudo}</div>
          <footer className="app-footer"><span>Movimentações, cadastros e relatórios</span><span>Projeto 2 · controle financeiro</span></footer>
        </main>
      </div>
    </div>
  )
}
