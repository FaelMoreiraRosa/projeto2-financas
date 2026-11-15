import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Lancamentos from './components/Lancamentos';
import Faturas from './components/Faturas';
import { getAuthToken } from './services/api';

const paginas = [
    { id: 'inicio', nome: 'Visão geral', marca: '01' },
    { id: 'lancamentos', nome: 'Lançamentos', marca: '02' },
    { id: 'faturas', nome: 'Faturas', marca: '03' }
];

export default function App() {
    const [pagina, setPagina] = useState('inicio');
    const conteudo = pagina === 'lancamentos'
        ? <Lancamentos />
        : pagina === 'faturas'
            ? <Faturas />
            : <Dashboard />;

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); setPagina('inicio'); }}>
                    <span className="brand-mark" aria-hidden="true"><span>F</span></span>
                    <span><strong>Finanças</strong><small>controle pessoal</small></span>
                </a>

                <div className="sidebar-section-label">Seu espaço</div>
                <nav className="primary-nav" aria-label="Navegação principal">
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
                    <span className="topbar-date">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}</span>
                </header>

                {!getAuthToken() && (
                    <div className="session-notice" role="status">
                        <span aria-hidden="true">i</span>
                        Entre pela autenticação do projeto para carregar os dados da sua conta.
                    </div>
                )}

                <div className="content-area" key={pagina}>{conteudo}</div>
                <footer className="app-footer"><span>Movimentações e faturas</span><span>Pessoa 3 · módulo financeiro</span></footer>
            </main>
        </div>
    );
}
