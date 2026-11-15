import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { currentMonth, formatCurrency, formatDate, monthRange, todayISO } from '../utils/formatters';

function novoFormulario() {
    return {
        tipo: 'saida',
        descricao: '',
        valor: '',
        data: todayISO(),
        categoriaId: '',
        fonteDestinoId: '',
        totalParcelas: '1'
    };
}

function mensagemErro(error) {
    if (error.status === 401) return 'Entre pela autenticação do projeto para consultar seus lançamentos.';
    return error.message || 'Não foi possível carregar os dados.';
}

export default function Lancamentos() {
    const [mes, setMes] = useState(currentMonth);
    const [tipoFiltro, setTipoFiltro] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [fonteFiltro, setFonteFiltro] = useState('');
    const [pagina, setPagina] = useState(1);
    const [dados, setDados] = useState({ lancamentos: [], total: 0, limite: 20 });
    const [categorias, setCategorias] = useState([]);
    const [fontes, setFontes] = useState([]);
    const [referenciasCarregadas, setReferenciasCarregadas] = useState(false);
    const [referenciasErro, setReferenciasErro] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [formAberto, setFormAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formulario, setFormulario] = useState(novoFormulario);
    const [errosCampos, setErrosCampos] = useState({});
    const [salvando, setSalvando] = useState(false);
    const [excluir, setExcluir] = useState(null);
    const [alteracao, setAlteracao] = useState(0);

    const categoriasDoTipo = useMemo(
        () => categorias.filter((categoria) => categoria.tipo === formulario.tipo),
        [categorias, formulario.tipo]
    );
    const fonteSelecionada = fontes.find((fonte) => String(fonte.id) === formulario.fonteDestinoId);
    const podeParcelar = formulario.tipo === 'saida' && fonteSelecionada?.tipo === 'cartao_credito';
    const totalPaginas = Math.max(1, Math.ceil(dados.total / dados.limite));

    useEffect(() => {
        let ativo = true;
        Promise.all([api.get('/api/categorias'), api.get('/api/fontes-destinos')])
            .then(([listaCategorias, listaFontes]) => {
                if (!ativo) return;
                setCategorias(listaCategorias);
                setFontes(listaFontes);
                setReferenciasErro('');
                setReferenciasCarregadas(true);
            })
            .catch((error) => {
                if (!ativo) return;
                setReferenciasErro(mensagemErro(error));
                setReferenciasCarregadas(false);
            });

        return () => { ativo = false; };
    }, [alteracao]);

    useEffect(() => {
        let ativo = true;
        setCarregando(true);
        setErro('');
        const query = new URLSearchParams({ ...monthRange(mes), pagina: String(pagina) });
        if (tipoFiltro) query.set('tipo', tipoFiltro);
        if (categoriaFiltro) query.set('categoriaId', categoriaFiltro);
        if (fonteFiltro) query.set('fonteDestinoId', fonteFiltro);

        api.get(`/api/lancamentos?${query}`)
            .then((resultado) => { if (ativo) setDados(resultado); })
            .catch((error) => { if (ativo) setErro(mensagemErro(error)); })
            .finally(() => { if (ativo) setCarregando(false); });

        return () => { ativo = false; };
    }, [mes, tipoFiltro, categoriaFiltro, fonteFiltro, pagina, alteracao]);

    function atualizarFiltro(setter, valor) {
        setter(valor);
        setPagina(1);
        setSucesso('');
    }

    function abrirNovo() {
        setFormulario(novoFormulario());
        setEditandoId(null);
        setErrosCampos({});
        setErro('');
        setSucesso('');
        setFormAberto(true);
    }

    async function abrirEdicao(lancamento) {
        setErro('');
        setSucesso('');
        setErrosCampos({});
        try {
            const registro = await api.get(`/api/lancamentos/${lancamento.id}`);
            setFormulario({
                tipo: registro.tipo,
                descricao: registro.descricao,
                valor: String(registro.valor_total_compra ?? registro.valor).replace('.', ','),
                data: String(registro.data).slice(0, 10),
                categoriaId: String(registro.categoria_id),
                fonteDestinoId: String(registro.fonte_destino_id),
                totalParcelas: String(registro.total_parcelas || 1)
            });
            setEditandoId(registro.id);
            setFormAberto(true);
        } catch (error) {
            setErro(mensagemErro(error));
        }
    }

    async function salvar(event) {
        event.preventDefault();
        setErrosCampos({});
        setErro('');
        setSucesso('');

        const valor = formulario.valor.trim().replace(',', '.');
        const campos = {};
        if (!formulario.descricao.trim()) campos.descricao = 'Informe a descrição.';
        if (!/^\d+(?:\.\d{1,2})?$/.test(valor) || Number(valor) <= 0) campos.valor = 'Informe um valor positivo com até duas casas decimais.';
        if (!formulario.data) campos.data = 'Informe a data.';
        if (!formulario.categoriaId) campos.categoriaId = 'Selecione uma categoria.';
        if (!formulario.fonteDestinoId) campos.fonteDestinoId = 'Selecione uma fonte ou destino.';
        if (!podeParcelar && formulario.totalParcelas !== '1') campos.totalParcelas = 'Parcelas disponíveis somente para saídas no cartão de crédito.';
        if (Object.keys(campos).length) {
            setErrosCampos(campos);
            return;
        }

        const corpo = {
            tipo: formulario.tipo,
            descricao: formulario.descricao.trim(),
            valor,
            data: formulario.data,
            categoriaId: Number(formulario.categoriaId),
            fonteDestinoId: Number(formulario.fonteDestinoId),
            totalParcelas: Number(formulario.totalParcelas)
        };

        setSalvando(true);
        try {
            if (editandoId) await api.put(`/api/lancamentos/${editandoId}`, corpo);
            else await api.post('/api/lancamentos', corpo);
            setSucesso(editandoId ? 'Lançamento atualizado.' : 'Lançamento cadastrado.');
            setFormulario(novoFormulario());
            setEditandoId(null);
            setFormAberto(false);
            setAlteracao((value) => value + 1);
        } catch (error) {
            setErrosCampos(error.fields || {});
            setErro(mensagemErro(error));
        } finally {
            setSalvando(false);
        }
    }

    async function confirmarExclusao(escopo) {
        if (!excluir) return;
        setErro('');
        try {
            const query = excluir.total_parcelas > 1 ? `?escopo=${escopo}` : '';
            await api.delete(`/api/lancamentos/${excluir.id}${query}`);
            setSucesso(escopo === 'grupo' ? 'Compra e parcelas excluídas.' : 'Lançamento excluído.');
            setExcluir(null);
            setAlteracao((value) => value + 1);
        } catch (error) {
            setErro(mensagemErro(error));
        }
    }

    function cancelarFormulario() {
        setFormAberto(false);
        setEditandoId(null);
        setFormulario(novoFormulario());
        setErrosCampos({});
    }

    return (
        <section className="page-stack" aria-labelledby="lancamentos-title">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Movimentações</p>
                    <h1 id="lancamentos-title">Cada movimento conta.</h1>
                    <p className="page-intro">Registre entradas e saídas, acompanhe o histórico e ajuste seus filtros.</p>
                </div>
                <button className="button button-primary" type="button" onClick={abrirNovo}>＋ Novo lançamento</button>
            </div>

            {erro && <div className="alert alert-error" role="alert">{erro}</div>}
            {sucesso && <div className="alert alert-success" role="status">{sucesso}</div>}
            {referenciasErro && (
                <div className="alert alert-info" role="status">
                    Não consegui carregar categorias e fontes/destinos. {referenciasErro}
                    <button type="button" className="text-button" onClick={() => setAlteracao((value) => value + 1)}>Tentar novamente</button>
                </div>
            )}

            {formAberto && (
                <form className="card-panel launch-form" onSubmit={salvar} noValidate>
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">{editandoId ? 'Editar registro' : 'Novo registro'}</p>
                            <h2>{editandoId ? 'Atualize os dados do lançamento' : 'O que aconteceu?'}</h2>
                        </div>
                        <button className="icon-button" type="button" onClick={cancelarFormulario} aria-label="Fechar formulário">×</button>
                    </div>

                    <div className="form-grid">
                        <fieldset className="field-group field-full">
                            <legend>Tipo de movimentação</legend>
                            <div className="segmented-control">
                                <button type="button" className={formulario.tipo === 'entrada' ? 'selected income-option' : ''} onClick={() => setFormulario((value) => ({ ...value, tipo: 'entrada', categoriaId: '', totalParcelas: '1' }))}>Entrada</button>
                                <button type="button" className={formulario.tipo === 'saida' ? 'selected expense-option' : ''} onClick={() => setFormulario((value) => ({ ...value, tipo: 'saida', categoriaId: '' }))}>Saída</button>
                            </div>
                            {errosCampos.tipo && <small className="field-error">{errosCampos.tipo}</small>}
                        </fieldset>

                        <label className="field field-full">
                            <span>Descrição</span>
                            <input maxLength="255" value={formulario.descricao} onChange={(event) => setFormulario((value) => ({ ...value, descricao: event.target.value }))} placeholder="Ex.: compra no mercado" required />
                            {errosCampos.descricao && <small className="field-error">{errosCampos.descricao}</small>}
                        </label>

                        <label className="field">
                            <span>Valor total</span>
                            <div className="input-affix"><span>R$</span><input inputMode="decimal" value={formulario.valor} onChange={(event) => setFormulario((value) => ({ ...value, valor: event.target.value }))} placeholder="0,00" required /></div>
                            {errosCampos.valor && <small className="field-error">{errosCampos.valor}</small>}
                        </label>

                        <label className="field">
                            <span>Data</span>
                            <input type="date" value={formulario.data} onChange={(event) => setFormulario((value) => ({ ...value, data: event.target.value }))} required />
                            {errosCampos.data && <small className="field-error">{errosCampos.data}</small>}
                        </label>

                        <label className="field">
                            <span>Categoria</span>
                            <select value={formulario.categoriaId} onChange={(event) => setFormulario((value) => ({ ...value, categoriaId: event.target.value }))} disabled={!referenciasCarregadas} required>
                                <option value="">Selecione uma categoria</option>
                                {categoriasDoTipo.map((categoria) => <option value={categoria.id} key={categoria.id}>{categoria.nome}</option>)}
                            </select>
                            {errosCampos.categoriaId && <small className="field-error">{errosCampos.categoriaId}</small>}
                        </label>

                        <label className="field">
                            <span>Fonte ou destino</span>
                            <select value={formulario.fonteDestinoId} onChange={(event) => setFormulario((value) => ({ ...value, fonteDestinoId: event.target.value, totalParcelas: fontes.find((fonte) => String(fonte.id) === event.target.value)?.tipo === 'cartao_credito' && value.tipo === 'saida' ? value.totalParcelas : '1' }))} disabled={!referenciasCarregadas} required>
                                <option value="">Selecione uma fonte ou destino</option>
                                {fontes.map((fonte) => <option value={fonte.id} key={fonte.id}>{fonte.nome}</option>)}
                            </select>
                            {errosCampos.fonteDestinoId && <small className="field-error">{errosCampos.fonteDestinoId}</small>}
                        </label>

                        <label className="field">
                            <span>Parcelas</span>
                            <select value={formulario.totalParcelas} onChange={(event) => setFormulario((value) => ({ ...value, totalParcelas: event.target.value }))} disabled={!podeParcelar}>
                                {Array.from({ length: 48 }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1}x</option>)}
                            </select>
                            <small className={errosCampos.totalParcelas ? 'field-error' : 'field-hint'}>{errosCampos.totalParcelas || (podeParcelar ? 'Até 48 parcelas no cartão.' : 'Disponível para saídas no cartão de crédito.')}</small>
                        </label>
                    </div>

                    <div className="form-actions">
                        <button className="button button-secondary" type="button" onClick={cancelarFormulario}>Cancelar</button>
                        <button className="button button-primary" type="submit" disabled={salvando || !referenciasCarregadas}>
                            {salvando ? 'Salvando…' : editandoId ? 'Salvar alterações' : 'Cadastrar lançamento'}
                        </button>
                    </div>
                </form>
            )}

            <section className="card-panel history-panel" aria-labelledby="history-title">
                <div className="section-heading history-heading">
                    <div>
                        <p className="eyebrow">Histórico</p>
                        <h2 id="history-title">Lançamentos recentes</h2>
                    </div>
                    <span className="result-count">{dados.total} {dados.total === 1 ? 'registro' : 'registros'}</span>
                </div>

                <div className="filter-bar">
                    <label className="filter-field"><span>Período</span><input aria-label="Filtrar por mês" type="month" value={mes} onChange={(event) => { if (event.target.value) atualizarFiltro(setMes, event.target.value); }} /></label>
                    <label className="filter-field"><span>Tipo</span><select value={tipoFiltro} onChange={(event) => atualizarFiltro(setTipoFiltro, event.target.value)}><option value="">Todos</option><option value="entrada">Entradas</option><option value="saida">Saídas</option></select></label>
                    <label className="filter-field"><span>Categoria</span><select value={categoriaFiltro} onChange={(event) => atualizarFiltro(setCategoriaFiltro, event.target.value)}><option value="">Todas</option>{categorias.map((categoria) => <option value={categoria.id} key={categoria.id}>{categoria.nome}</option>)}</select></label>
                    <label className="filter-field"><span>Fonte/destino</span><select value={fonteFiltro} onChange={(event) => atualizarFiltro(setFonteFiltro, event.target.value)}><option value="">Todas</option>{fontes.map((fonte) => <option value={fonte.id} key={fonte.id}>{fonte.nome}</option>)}</select></label>
                </div>

                {carregando && <div className="state-card compact-state" role="status"><span className="loader" />Carregando lançamentos…</div>}
                {!carregando && !erro && dados.lancamentos.length === 0 && (
                    <div className="empty-table"><span aria-hidden="true">⌁</span><h3>Nenhum lançamento neste período</h3><p>Escolha outro filtro ou registre uma movimentação.</p></div>
                )}
                {!carregando && !erro && dados.lancamentos.length > 0 && (
                    <div className="table-scroll">
                        <table className="launch-table">
                            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th><span className="visually-hidden">Ações</span></th></tr></thead>
                            <tbody>
                                {dados.lancamentos.map((lancamento) => (
                                    <tr key={lancamento.id}>
                                        <td className="date-cell">{formatDate(lancamento.data)}</td>
                                        <td><div className="launch-description"><strong>{lancamento.descricao}</strong>{lancamento.total_parcelas > 1 && <span className="installment-badge">Parcela {lancamento.parcela_atual}/{lancamento.total_parcelas}</span>}</div></td>
                                        <td>{lancamento.categoria_nome || '—'}</td>
                                        <td><span className={`type-pill ${lancamento.tipo === 'entrada' ? 'pill-income' : 'pill-expense'}`}>{lancamento.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                                        <td className={`amount-cell ${lancamento.tipo === 'entrada' ? 'amount-income' : ''}`}>{formatCurrency(lancamento.valor)}</td>
                                        <td><div className="row-actions"><button type="button" className="text-button" onClick={() => abrirEdicao(lancamento)} disabled={lancamento.total_parcelas > 1 && !lancamento.grupo_completo} title={lancamento.total_parcelas > 1 && !lancamento.grupo_completo ? 'A edição fica indisponível após excluir uma parcela individual.' : undefined}>Editar</button><button type="button" className="text-button danger-text" onClick={() => setExcluir(lancamento)}>Excluir</button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="pagination">
                    <span>Página {pagina} de {totalPaginas}</span>
                    <div>
                        <button className="button button-page" type="button" onClick={() => setPagina((value) => Math.max(1, value - 1))} disabled={pagina <= 1 || carregando}>Anterior</button>
                        <button className="button button-page" type="button" onClick={() => setPagina((value) => Math.min(totalPaginas, value + 1))} disabled={pagina >= totalPaginas || carregando}>Próxima</button>
                    </div>
                </div>
            </section>

            {excluir && (
                <div className="dialog-backdrop" role="presentation">
                    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
                        <span className="dialog-mark" aria-hidden="true">!</span>
                        <h2 id="delete-title">Excluir lançamento?</h2>
                        <p id="delete-description">{excluir.total_parcelas > 1 ? 'Esta movimentação faz parte de uma compra parcelada. Escolha o que deseja remover.' : 'Essa ação remove o registro do seu histórico.'}</p>
                        <div className="dialog-actions">
                            {excluir.total_parcelas > 1 ? (
                                <>
                                    <button className="button button-secondary" type="button" onClick={() => setExcluir(null)}>Cancelar</button>
                                    <button className="button button-secondary" type="button" onClick={() => confirmarExclusao('parcela')}>Somente esta parcela</button>
                                    <button className="button button-danger" type="button" onClick={() => confirmarExclusao('grupo')}>Todas as parcelas</button>
                                </>
                            ) : (
                                <>
                                    <button className="button button-secondary" type="button" onClick={() => setExcluir(null)}>Manter</button>
                                    <button className="button button-danger" type="button" onClick={() => confirmarExclusao('parcela')}>Excluir lançamento</button>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}
