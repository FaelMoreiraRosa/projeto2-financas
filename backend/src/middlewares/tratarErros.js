function tratarErros(erro, req, res, next) {
    // Se a resposta já começou, delega ao Express.
    if (res.headersSent) {
        return next(erro);
    }

    console.error('Erro na aplicação:', erro);

    // JSON enviado pelo cliente possui sintaxe inválida.
    if (erro.type === 'entity.parse.failed') {
        return res.status(400).json({
            erro: 'O JSON enviado é inválido.',
            campos: {}
        });
    }

    // Outros erros inesperados.
    return res.status(500).json({
        erro: 'Erro interno do servidor.',
        campos: {}
    });
}

module.exports = tratarErros;