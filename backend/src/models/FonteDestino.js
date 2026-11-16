
const pool = require('../config/database');

// Listar fontes e destinos do usuário autenticado
async function listar(usuarioId, tipo) {
    let consulta = `
        SELECT id, usuario_id, nome, tipo,
               dia_fechamento, dia_vencimento, limite
        FROM fontes_destinos
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

// Buscar uma fonte ou destino pelo ID
async function buscarPorId(id, usuarioId) {
    const resultado = await pool.query(
        `SELECT id, usuario_id, nome, tipo,
                dia_fechamento, dia_vencimento, limite
         FROM fontes_destinos
         WHERE id = $1 AND usuario_id = $2`,
        [id, usuarioId]
    );

    return resultado.rows[0] || null;
}

// Criar uma fonte ou destino
async function criar({
    usuarioId,
    nome,
    tipo,
    diaFechamento,
    diaVencimento,
    limite
}) {
    const resultado = await pool.query(
        `INSERT INTO fontes_destinos
            (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, usuario_id, nome, tipo,
                   dia_fechamento, dia_vencimento, limite`,
        [
            usuarioId,
            nome,
            tipo,
            diaFechamento,
            diaVencimento,
            limite
        ]
    );

    return resultado.rows[0];
}

// Atualizar uma fonte ou destino
async function atualizar({
    id,
    usuarioId,
    nome,
    tipo,
    diaFechamento,
    diaVencimento,
    limite
}) {
    const resultado = await pool.query(
        `UPDATE fontes_destinos
         SET nome = $1,
             tipo = $2,
             dia_fechamento = $3,
             dia_vencimento = $4,
             limite = $5
         WHERE id = $6 AND usuario_id = $7
         RETURNING id, usuario_id, nome, tipo,
                   dia_fechamento, dia_vencimento, limite`,
        [
            nome,
            tipo,
            diaFechamento,
            diaVencimento,
            limite,
            id,
            usuarioId
        ]
    );

    return resultado.rows[0] || null;
}

// Excluir uma fonte ou destino
async function excluir(id, usuarioId) {
    const resultado = await pool.query(
        `DELETE FROM fontes_destinos
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
