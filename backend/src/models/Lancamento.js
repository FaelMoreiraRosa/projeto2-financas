const pool = require('../config/database');

// shortcut: assumes Pessoa 2 tables are categorias and fontes_destinos; align when their schema lands.
async function buscarCategoria(usuarioId, categoriaId) {
    const resultado = await pool.query(
        'SELECT id, tipo FROM categorias WHERE id = $1 AND usuario_id = $2',
        [categoriaId, usuarioId]
    );

    return resultado.rows[0] || null;
}

async function buscarFonteDestino(usuarioId, fonteDestinoId) {
    const resultado = await pool.query(
        'SELECT id FROM fontes_destinos WHERE id = $1 AND usuario_id = $2',
        [fonteDestinoId, usuarioId]
    );

    return resultado.rows[0] || null;
}

async function listar(usuarioId, filtros) {
    const condicoes = ['usuario_id = $1'];
    const valores = [usuarioId];

    for (const [campo, operador, valor] of [
        ['data', '>=', filtros.inicio],
        ['data', '<=', filtros.fim],
        ['tipo', '=', filtros.tipo],
        ['categoria_id', '=', filtros.categoriaId],
        ['fonte_destino_id', '=', filtros.fonteDestinoId]
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
        `SELECT COUNT(*)::int AS total FROM lancamentos WHERE ${where}`,
        valores
    );
    const resultado = await pool.query(
        `SELECT * FROM lancamentos WHERE ${where}
         ORDER BY data DESC, id DESC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
        [...valores, limite, offset]
    );

    return { lancamentos: resultado.rows, total: total.rows[0].total, pagina: filtros.pagina, limite };
}

async function buscarPorId(id, usuarioId) {
    const resultado = await pool.query(
        'SELECT * FROM lancamentos WHERE id = $1 AND usuario_id = $2',
        [id, usuarioId]
    );

    return resultado.rows[0] || null;
}

async function criar({ usuarioId, tipo, descricao, valor, data, categoriaId, fonteDestinoId }) {
    const resultado = await pool.query(
        `INSERT INTO lancamentos
            (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [usuarioId, tipo, descricao, valor, data, categoriaId, fonteDestinoId]
    );

    return resultado.rows[0];
}

async function atualizar({ id, usuarioId, tipo, descricao, valor, data, categoriaId, fonteDestinoId }) {
    const resultado = await pool.query(
        `UPDATE lancamentos
         SET tipo = $1, descricao = $2, valor = $3, data = $4,
             categoria_id = $5, fonte_destino_id = $6
         WHERE id = $7 AND usuario_id = $8 AND total_parcelas = 1
         RETURNING *`,
        [tipo, descricao, valor, data, categoriaId, fonteDestinoId, id, usuarioId]
    );

    return resultado.rows[0] || null;
}

async function excluir(id, usuarioId) {
    const resultado = await pool.query(
        'DELETE FROM lancamentos WHERE id = $1 AND usuario_id = $2 AND total_parcelas = 1',
        [id, usuarioId]
    );

    return resultado.rowCount > 0;
}

module.exports = {
    buscarCategoria,
    buscarFonteDestino,
    listar,
    buscarPorId,
    criar,
    atualizar,
    excluir
};
