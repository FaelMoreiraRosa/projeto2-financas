
const express = require('express');
const router = express.Router();

const Relatorio = require('../models/Relatorio');
const autenticar = require('../middlewares/autenticar');

router.use(autenticar);

// Validar datas recebidas nos filtros
function validarData(data) {
    if (typeof data !== 'string') {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return false;
    }

    const dataConvertida = new Date(`${data}T00:00:00.000Z`);

    return !Number.isNaN(dataConvertida.getTime()) &&
        dataConvertida.toISOString().slice(0, 10) === data;
}

// Obter e validar o período informado
function obterPeriodo(req) {
    const inicio = req.query.inicio ?? null;
    const fim = req.query.fim ?? null;
    const campos = {};

    if (inicio !== null && !validarData(inicio)) {
        campos.inicio = 'Informe uma data inicial válida no formato AAAA-MM-DD.';
    }

    if (fim !== null && !validarData(fim)) {
        campos.fim = 'Informe uma data final válida no formato AAAA-MM-DD.';
    }

    if (
        inicio !== null &&
        fim !== null &&
        validarData(inicio) &&
        validarData(fim) &&
        inicio > fim
    ) {
        campos.fim = 'A data final não pode ser anterior à data inicial.';
    }

    return {
        inicio,
        fim,
        campos
    };
}

// Relatório agrupado por categorias
router.get('/categorias', async (req, res, next) => {
    try {
        const { inicio, fim, campos } = obterPeriodo(req);

        if (Object.keys(campos).length > 0) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos
            });
        }

        const relatorio = await Relatorio.porCategorias(
            req.usuarioId,
            inicio,
            fim
        );

        return res.status(200).json(relatorio);
    } catch (erro) {
        next(erro);
    }
});

// Relatório agrupado por fontes e destinos
router.get('/fontes-destinos', async (req, res, next) => {
    try {
        const { inicio, fim, campos } = obterPeriodo(req);

        if (Object.keys(campos).length > 0) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos
            });
        }

        const relatorio = await Relatorio.porFontesDestinos(
            req.usuarioId,
            inicio,
            fim
        );

        return res.status(200).json(relatorio);
    } catch (erro) {
        next(erro);
    }
});

module.exports = router;
