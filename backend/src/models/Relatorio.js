
const pool = require('../config/database');

// Gerar relatório agrupado por categorias
async function porCategorias(usuarioId, inicio, fim) {
    const resultado = await pool.query(
        `SELECT
            c.id AS categoria_id,
            c.nome AS categoria,
            c.tipo,
            COUNT(l.id)::int AS quantidade_lancamentos,
            COALESCE(SUM(l.valor), 0)::numeric(12, 2) AS total
         FROM categorias c
         LEFT JOIN lancamentos l
            ON l.categoria_id = c.id
            AND l.usuario_id = c.usuario_id
            AND ($2::date IS NULL OR l.data >= $2)
            AND ($3::date IS NULL OR l.data <= $3)
         WHERE c.usuario_id = $1
         GROUP BY c.id, c.nome, c.tipo
         ORDER BY c.tipo, c.nome`,
        [usuarioId, inicio, fim]
    );

    return resultado.rows;
}

// Gerar relatório agrupado por fontes e destinos
async function porFontesDestinos(usuarioId, inicio, fim) {
    const resultado = await pool.query(
        `SELECT
            f.id AS fonte_destino_id,
            f.nome AS fonte_destino,
            f.tipo AS tipo_fonte_destino,
            COUNT(l.id)::int AS quantidade_lancamentos,
            COALESCE(
                SUM(l.valor) FILTER (WHERE l.tipo = 'entrada'),
                0
            )::numeric(12, 2) AS total_entradas,
            COALESCE(
                SUM(l.valor) FILTER (WHERE l.tipo = 'saida'),
                0
            )::numeric(12, 2) AS total_saidas
         FROM fontes_destinos f
         LEFT JOIN lancamentos l
            ON l.fonte_destino_id = f.id
            AND l.usuario_id = f.usuario_id
            AND ($2::date IS NULL OR l.data >= $2)
            AND ($3::date IS NULL OR l.data <= $3)
         WHERE f.usuario_id = $1
         GROUP BY f.id, f.nome, f.tipo
         ORDER BY f.tipo, f.nome`,
        [usuarioId, inicio, fim]
    );

    return resultado.rows;
}

module.exports = {
    porCategorias,
    porFontesDestinos
};
