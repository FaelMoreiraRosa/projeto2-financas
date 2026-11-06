const pool = require('../config/database');
const bcrypt = require('bcrypt');

async function buscarPorEmail(email) {
    const resultado = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
    );

    return resultado.rows[0] || null;
}

async function buscarPorId(id) {
    const resultado = await pool.query(
        'SELECT * FROM usuarios WHERE id = $1',
        [id]
    );

    return resultado.rows[0] || null;
}

async function criar({ nome, email, cpf, senha }) {
    const senhaHash = await bcrypt.hash(senha, 10);

    const resultado = await pool.query(
        `INSERT INTO usuarios (nome, email, cpf, senha_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nome, email, cpf, criado_em`,
        [nome, email, cpf, senhaHash]
    );

    return resultado.rows[0];
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    criar
};
