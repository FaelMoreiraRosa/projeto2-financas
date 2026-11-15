const express = require('express');
const autenticar = require('../middlewares/autenticar');
const Fatura = require('../models/Fatura');

const router = express.Router();
router.use(autenticar);

router.get('/', async (req, res) => {
    const textoMeses = req.query.meses === undefined ? '3' : req.query.meses;
    const meses = Number(textoMeses);

    if (!/^\d+$/.test(String(textoMeses)) || !Number.isInteger(meses) || meses < 1 || meses > 48) {
        return res.status(400).json({
            erro: 'Verifique os filtros informados.',
            campos: { meses: 'Informe a quantidade de meses entre 1 e 48.' }
        });
    }

    try {
        const cartoes = await Fatura.listar(req.usuarioId, meses);
        return res.status(200).json({ cartoes });
    } catch (erro) {
        console.error('Erro ao calcular faturas:', erro);
        return res.status(500).json({ erro: 'Erro interno ao calcular as faturas.', campos: {} });
    }
});

module.exports = router;
