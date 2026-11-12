require('dotenv').config();

const jwt = require('jsonwebtoken');

function gerarToken(usuarioId) {
    return jwt.sign(
        { usuarioId },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        }
    );
}

function verificarToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
    gerarToken,
    verificarToken
};