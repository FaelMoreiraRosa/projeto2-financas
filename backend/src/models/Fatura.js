const pool = require('../config/database');
const Financeiro = require('./Financeiro');

function hojeLocal() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

async function listar(usuarioId, mesesFuturos = 3) {
    const cartoes = await pool.query(
        `SELECT id, nome, dia_fechamento, dia_vencimento, limite
         FROM fontes_destinos
         WHERE usuario_id = $1 AND tipo = 'cartao_credito'
         ORDER BY nome, id`,
        [usuarioId]
    );

    if (!cartoes.rows.length) return [];

    const ids = cartoes.rows.map((cartao) => cartao.id);
    const lancamentos = await pool.query(
        `SELECT l.id, l.fonte_destino_id, l.descricao, l.valor::text AS valor,
                l.data::text AS data, l.parcela_atual, l.total_parcelas,
                l.grupo_parcelamento, c.nome AS categoria_nome
         FROM lancamentos l
         JOIN fontes_destinos fd
           ON fd.id = l.fonte_destino_id AND fd.usuario_id = l.usuario_id
         LEFT JOIN categorias c
           ON c.id = l.categoria_id AND c.usuario_id = l.usuario_id
         WHERE l.usuario_id = $1
           AND l.fonte_destino_id = ANY($2::int[])
           AND l.tipo = 'saida'
         ORDER BY l.data, l.id`,
        [usuarioId, ids]
    );

    return Financeiro.calcularFaturas(cartoes.rows, lancamentos.rows, hojeLocal(), mesesFuturos);
}

module.exports = { listar };
