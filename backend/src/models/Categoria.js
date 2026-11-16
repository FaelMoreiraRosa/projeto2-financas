
const pool = require('../config/database');

async function listar(usuarioId, tipo) {
    let consulta = `
        SELECT id, usuario_id, nome, tipo
        FROM categorias
        WHERE usuario_id = $1
    `;

    const valores = [usuarioId];

    if (tipo) {
        consulta += ' AND tipo = $2';
        valores.push(tipo);
    }

    consulta += ' ORDER BY nome ASC';

    const resultado = await pool.query(consulta, valores);

    return resultado.rows;
}

async function buscarPorId(id, usuarioId) {
    const resultado = await pool.query(
        `SELECT id, usuario_id, nome, tipo
         FROM categorias
         WHERE id = $1 AND usuario_id = $2`,
        [id, usuarioId]
    );

    return resultado.rows[0] || null;
}

async function criar({ usuarioId, nome, tipo }) {
    const resultado = await pool.query(
        `INSERT INTO categorias (usuario_id, nome, tipo)
         VALUES ($1, $2, $3)
         RETURNING id, usuario_id, nome, tipo`,
        [usuarioId, nome, tipo]
    );

    return resultado.rows[0];
}

async function atualizar({ id, usuarioId, nome, tipo }) {
    const resultado = await pool.query(
        `UPDATE categorias
         SET nome = $1, tipo = $2
         WHERE id = $3 AND usuario_id = $4
         RETURNING id, usuario_id, nome, tipo`,
        [nome, tipo, id, usuarioId]
    );

    return resultado.rows[0] || null;
}

async function excluir(id, usuarioId) {
    const resultado = await pool.query(
        `DELETE FROM categorias
         WHERE id = $1 AND usuario_id = $2`,
        [id, usuarioId]
    );

    return resultado.rowCount > 0;
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    excluir
};
