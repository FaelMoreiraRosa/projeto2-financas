import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatMonth } from '../utils/formatters';

function MensagemVazia({ children }) {
    return <p className="empty-inline">{children}</p>;
}

export default function Faturas() {
    const [atualizacao, setAtualizacao] = useState(0);
    const [resultado, setResultado] = useState({ atualizacao: null, cartoes: [], erro: '' });

    useEffect(() => {
        let ativo = true;
        api.get('/api/relatorios/faturas?meses=3')
            .then((dados) => { if (ativo) setResultado({ atualizacao, cartoes: dados.cartoes || [], erro: '' }); })
            .catch((error) => { if (ativo) setResultado({ atualizacao, cartoes: [], erro: error.message }); });

        return () => { ativo = false; };
    }, [atualizacao]);

    const carregando = resultado.atualizacao !== atualizacao;
    const cartoes = carregando ? [] : resultado.cartoes;
    const erro = carregando ? '' : resultado.erro;

    return (
        <section className="page-stack" aria-labelledby="faturas-title">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Cartões de crédito</p>
                    <h1 id="faturas-title">Faturas no horizonte.</h1>
                    <p className="page-intro">Acompanhe o ciclo atual e veja como as próximas parcelas se distribuem.</p>
                </div>
                <button className="button button-secondary" type="button" onClick={() => setAtualizacao((value) => value + 1)} disabled={carregando}>
                    Atualizar faturas
                </button>
            </div>

            {erro && <div className="alert alert-error" role="alert">{erro}</div>}
            {carregando && <div className="state-card" role="status"><span className="loader" />Buscando os cartões e os próximos ciclos…</div>}
            {!carregando && !erro && cartoes.length === 0 && (
                <div className="state-card state-empty">
                    <span className="empty-symbol" aria-hidden="true">◌</span>
                    <h2>Nenhum cartão cadastrado</h2>
                    <p>Quando houver cartões de crédito cadastrados, suas faturas aparecerão aqui.</p>
                </div>
            )}

            {!carregando && !erro && cartoes.map((cartao) => (
                <article className="card-panel credit-card-panel" key={cartao.id}>
                    <div className="credit-card-heading">
                        <div>
                            <p className="eyebrow">Cartão de crédito</p>
                            <h2>{cartao.nome}</h2>
                        </div>
                        <div className="card-limit-grid">
                            <div><span>Limite</span><strong>{formatCurrency(cartao.limite)}</strong></div>
                            <div><span>Utilizado</span><strong>{formatCurrency(cartao.limiteUtilizado)}</strong></div>
                            <div><span>Disponível</span><strong>{formatCurrency(cartao.limiteDisponivel)}</strong></div>
                        </div>
                    </div>

                    <div className="invoice-grid">
                        {(cartao.faturas || []).map((fatura, index) => (
                            <section className={`invoice-card ${index === 0 ? 'invoice-current' : ''}`} key={fatura.mes}>
                                <div className="invoice-card-heading">
                                    <div>
                                        <span className="invoice-state">{index === 0 ? 'Ciclo atual' : `Próxima ${index}`}</span>
                                        <h3>{formatMonth(fatura.mes)}</h3>
                                    </div>
                                    <strong className="invoice-total">{formatCurrency(fatura.total)}</strong>
                                </div>
                                <div className="invoice-dates">
                                    <span>Fecha <b>{formatDate(fatura.fechamento)}</b></span>
                                    <span>Vence <b>{formatDate(fatura.vencimento)}</b></span>
                                </div>
                                <div className="invoice-lines">
                                    {(fatura.lancamentos || []).length === 0 ? (
                                        <MensagemVazia>Nenhum lançamento neste ciclo.</MensagemVazia>
                                    ) : fatura.lancamentos.map((lancamento) => (
                                        <div className="invoice-line" key={`${fatura.mes}-${lancamento.id}`}>
                                            <div>
                                                <strong>{lancamento.descricao}</strong>
                                                <span>{lancamento.categoria || 'Sem categoria'} · parcela {lancamento.parcelaAtual}/{lancamento.totalParcelas}</span>
                                            </div>
                                            <b>{formatCurrency(lancamento.valor)}</b>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </article>
            ))}
        </section>
    );
}
