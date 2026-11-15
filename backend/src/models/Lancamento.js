const { randomUUID } = require('node:crypto');
const pool = require('../config/database');
const Financeiro = require('./Financeiro');

const selectLancamento = `
    SELECT l.*,
           c.nome AS categoria_nome,
           fd.nome AS fonte_destino_nome,
           fd.tipo AS fonte_destino_tipo,
           CASE WHEN l.grupo_parcelamento IS NULL THEN l.valor::text
                ELSE (SELECT SUM(gr.valor)::text
                      FROM lancamentos gr
                      WHERE gr.grupo_parcelamento = l.grupo_parcelamento
                        AND gr.usuario_id = l.usuario_id)
           END AS valor_total_compra,
           CASE WHEN l.grupo_parcelamento IS NULL THEN TRUE
                ELSE (SELECT COUNT(*) = l.total_parcelas
                      FROM lancamentos gr
                      WHERE gr.grupo_parcelamento = l.grupo_parcelamento
                        AND gr.usuario_id = l.usuario_id)
           END AS grupo_completo
    FROM lancamentos l
    JOIN categorias c ON c.id = l.categoria_id AND c.usuario_id = l.usuario_id
    JOIN fontes_destinos fd ON fd.id = l.fonte_destino_id AND fd.usuario_id = l.usuario_id`;

async function buscarCategoria(usuarioId, categoriaId) {
    const resultado = await pool.query(
        'SELECT id, tipo FROM categorias WHERE id = $1 AND usuario_id = $2',
        [categoriaId, usuarioId]
    );

    return resultado.rows[0] || null;
}

async function buscarFonteDestino(usuarioId, fonteDestinoId) {
    const resultado = await pool.query(
        'SELECT id, tipo, dia_fechamento, dia_vencimento, limite FROM fontes_destinos WHERE id = $1 AND usuario_id = $2',
        [fonteDestinoId, usuarioId]
    );

    return resultado.rows[0] || null;
}

async function listar(usuarioId, filtros) {
    const condicoes = ['l.usuario_id = $1'];
    const valores = [usuarioId];

    for (const [campo, operador, valor] of [
        ['l.data', '>=', filtros.inicio],
        ['l.data', '<=', filtros.fim],
        ['l.tipo', '=', filtros.tipo],
        ['l.categoria_id', '=', filtros.categoriaId],
        ['l.fonte_destino_id', '=', filtros.fonteDestinoId]
    ]) {
        if (valor !== undefined) {
            valores.push(valor);
            condicoes.push(`${campo} ${operador} $${valores.length}`);
        }
    }

    const where = condicoes.join(' AND ');
    const limite = 20;
    const offset = (filtros.pagina - 1) * limite;
    const total = await pool.query(
        `SELECT COUNT(*)::int AS total FROM lancamentos l WHERE ${where}`,
        valores
    );
    const resultado = await pool.query(
        `${selectLancamento} WHERE ${where}
         ORDER BY l.data DESC, l.id DESC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
        [...valores, limite, offset]
    );

    return { lancamentos: resultado.rows, total: total.rows[0].total, pagina: filtros.pagina, limite };
}

async function resumir(usuarioId, filtros) {
    const condicoes = ['usuario_id = $1'];
    const valores = [usuarioId];

    for (const [campo, operador, valor] of [
        ['data', '>=', filtros.inicio],
        ['data', '<=', filtros.fim]
    ]) {
        if (valor !== undefined) {
            valores.push(valor);
            condicoes.push(`${campo} ${operador} $${valores.length}`);
        }
    }

    const resultado = await pool.query(
        `SELECT COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0)::text AS entradas,
                COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0)::text AS saidas
         FROM lancamentos WHERE ${condicoes.join(' AND ')}`,
        valores
    );

    return resultado.rows[0];
}

async function buscarPorId(id, usuarioId) {
    const resultado = await pool.query(
        `${selectLancamento} WHERE l.id = $1 AND l.usuario_id = $2`,
        [id, usuarioId]
    );

    return resultado.rows[0] || null;
}

async function inserirParcela(cliente, dados, valor, parcelaAtual, totalParcelas, grupoParcelamento) {
    const resultado = await cliente.query(
        `INSERT INTO lancamentos
            (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id,
             parcela_atual, total_parcelas, grupo_parcelamento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
            dados.usuarioId, dados.tipo, dados.descricao, valor, dados.data,
            dados.categoriaId, dados.fonteDestinoId, parcelaAtual, totalParcelas,
            grupoParcelamento
        ]
    );

    return resultado.rows[0];
}

async function criar(dados) {
    const totalParcelas = dados.totalParcelas || 1;
    const valores = Financeiro.dividirValorEmParcelas(dados.valor, totalParcelas);
    const grupoParcelamento = totalParcelas > 1 ? randomUUID() : null;
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');
        const criados = [];
        for (let indice = 0; indice < totalParcelas; indice++) {
            criados.push(await inserirParcela(
                cliente, dados, valores[indice], indice + 1, totalParcelas, grupoParcelamento
            ));
        }
        await cliente.query('COMMIT');

        return { ...criados[0], valor_total_compra: dados.valor };
    } catch (erro) {
        await cliente.query('ROLLBACK');
        throw erro;
    } finally {
        cliente.release();
    }
}

async function atualizar(dados) {
    const totalParcelas = dados.totalParcelas || 1;
    const valores = Financeiro.dividirValorEmParcelas(dados.valor, totalParcelas);
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');
        const selecionado = await cliente.query(
            'SELECT id, usuario_id, grupo_parcelamento FROM lancamentos WHERE id = $1 AND usuario_id = $2 FOR UPDATE',
            [dados.id, dados.usuarioId]
        );
        if (!selecionado.rows[0]) {
            await cliente.query('ROLLBACK');
            return null;
        }

        const original = selecionado.rows[0];
        let existentes = [original];
        if (original.grupo_parcelamento) {
            const grupo = await cliente.query(
                `SELECT id, parcela_atual FROM lancamentos
                 WHERE usuario_id = $1 AND grupo_parcelamento = $2
                 ORDER BY parcela_atual, id FOR UPDATE`,
                [dados.usuarioId, original.grupo_parcelamento]
            );
            existentes = [
                original,
                ...grupo.rows.filter((linha) => linha.id !== original.id)
            ];
        }

        const grupoParcelamento = totalParcelas > 1
            ? original.grupo_parcelamento || randomUUID()
            : null;
        const atualizados = [];
        const manter = Math.min(totalParcelas, existentes.length);

        for (let indice = 0; indice < manter; indice++) {
            const linha = await cliente.query(
                `UPDATE lancamentos
                 SET tipo = $1, descricao = $2, valor = $3, data = $4,
                     categoria_id = $5, fonte_destino_id = $6,
                     parcela_atual = $7, total_parcelas = $8, grupo_parcelamento = $9
                 WHERE id = $10 AND usuario_id = $11
                 RETURNING *`,
                [
                    dados.tipo, dados.descricao, valores[indice], dados.data,
                    dados.categoriaId, dados.fonteDestinoId, indice + 1,
                    totalParcelas, grupoParcelamento, existentes[indice].id, dados.usuarioId
                ]
            );
            atualizados.push(linha.rows[0]);
        }

        const excedentes = existentes.slice(totalParcelas).map((linha) => linha.id);
        if (excedentes.length) {
            await cliente.query(
                'DELETE FROM lancamentos WHERE usuario_id = $1 AND id = ANY($2::int[])',
                [dados.usuarioId, excedentes]
            );
        }

        for (let indice = existentes.length; indice < totalParcelas; indice++) {
            atualizados.push(await inserirParcela(
                cliente, dados, valores[indice], indice + 1, totalParcelas, grupoParcelamento
            ));
        }

        await cliente.query('COMMIT');
        return { ...atualizados[0], valor_total_compra: dados.valor };
    } catch (erro) {
        await cliente.query('ROLLBACK');
        throw erro;
    } finally {
        cliente.release();
    }
}

async function excluir(id, usuarioId, escopo = 'parcela') {
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');
        const resultado = await cliente.query(
            'SELECT id, grupo_parcelamento FROM lancamentos WHERE id = $1 AND usuario_id = $2 FOR UPDATE',
            [id, usuarioId]
        );
        const lancamento = resultado.rows[0];
        if (!lancamento) {
            await cliente.query('ROLLBACK');
            return false;
        }

        if (escopo === 'grupo' && lancamento.grupo_parcelamento) {
            await cliente.query(
                'DELETE FROM lancamentos WHERE usuario_id = $1 AND grupo_parcelamento = $2',
                [usuarioId, lancamento.grupo_parcelamento]
            );
        } else {
            await cliente.query(
                'DELETE FROM lancamentos WHERE id = $1 AND usuario_id = $2',
                [id, usuarioId]
            );
        }

        await cliente.query('COMMIT');
        return true;
    } catch (erro) {
        await cliente.query('ROLLBACK');
        throw erro;
    } finally {
        cliente.release();
    }
}

module.exports = {
    buscarCategoria,
    buscarFonteDestino,
    listar,
    resumir,
    buscarPorId,
    criar,
    atualizar,
    excluir,
    ...Financeiro
};
