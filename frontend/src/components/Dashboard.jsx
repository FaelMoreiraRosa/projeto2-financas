import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { currentMonth, formatCurrency, monthRange } from '../utils/formatters';

export default function Dashboard() {
    const [mes, setMes] = useState(currentMonth);
    const [resumo, setResumo] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let ativo = true;
        setCarregando(true);
        setErro('');
        setResumo(null);
        const periodo = monthRange(mes);
        const query = new URLSearchParams(periodo);

        api.get(`/api/lancamentos/resumo?${query}`)
            .then((dados) => { if (ativo) setResumo(dados); })
            .catch((error) => { if (ativo) setErro(error.message); })
            .finally(() => { if (ativo) setCarregando(false); });

        return () => { ativo = false; };
    }, [mes]);

    return (
        <section className="page-stack" aria-labelledby="dashboard-title">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Visão do período</p>
                    <h1 id="dashboard-title">Seu mês, em equilíbrio.</h1>
                    <p className="page-intro">Entradas, saídas e saldo calculados a partir dos seus lançamentos.</p>
                </div>
                <label className="month-picker">
                    <span>Mês analisado</span>
                    <input type="month" value={mes} onChange={(event) => { if (event.target.value) setMes(event.target.value); }} />
                </label>
            </div>

            {erro && <div className="alert alert-error" role="alert">{erro}</div>}

            <div className="summary-grid" aria-live="polite">
                <article className="summary-card summary-income">
                    <div className="summary-card-top"><span>Entradas</span><span className="summary-mark">+</span></div>
                    <strong>{carregando || erro ? '—' : formatCurrency(resumo?.entradas)}</strong>
                    <span className="summary-note">Total recebido no período</span>
                </article>
                <article className="summary-card summary-expense">
                    <div className="summary-card-top"><span>Saídas</span><span className="summary-mark">−</span></div>
                    <strong>{carregando || erro ? '—' : formatCurrency(resumo?.saidas)}</strong>
                    <span className="summary-note">Total gasto no período</span>
                </article>
                <article className="summary-card summary-balance">
                    <div className="summary-card-top"><span>Saldo</span><span className="summary-mark">=</span></div>
                    <strong>{carregando || erro ? '—' : formatCurrency(resumo?.saldo)}</strong>
                    <span className="summary-note">Entradas menos saídas</span>
                </article>
            </div>

            <div className="ledger-note">
                <span className="ledger-note-symbol" aria-hidden="true">↗</span>
                <div>
                    <h2>Um retrato fiel do período</h2>
                    <p>Os indicadores vêm da API e respeitam o usuário autenticado e o mês selecionado.</p>
                </div>
            </div>
        </section>
    );
}
