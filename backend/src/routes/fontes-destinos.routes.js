
const express = require('express');
const router = express.Router();

const FonteDestino = require('../models/FonteDestino');
const autenticar = require('../middlewares/autenticar');

router.use(autenticar);

// Listar fontes e destinos do usuário autenticado
router.get('/', async (req, res, next) => {
    try {
        const { tipo } = req.query;
        const tiposPermitidos = ['renda', 'conta', 'cartao_credito'];

        if (tipo && !tiposPermitidos.includes(tipo)) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos: {
                    tipo: 'O tipo deve ser renda, conta ou cartao_credito.'
                }
            });
        }

        const fontesDestinos = await FonteDestino.listar(
            req.usuarioId,
            tipo
        );

        return res.status(200).json(fontesDestinos);
    } catch (erro) {
        next(erro);
    }
});

// Buscar uma fonte ou destino pelo ID
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos: {
                    id: 'Informe um ID válido.'
                }
            });
        }

        const fonteDestino = await FonteDestino.buscarPorId(
            id,
            req.usuarioId
        );

        if (!fonteDestino) {
            return res.status(404).json({
                erro: 'Fonte ou destino não encontrado.',
                campos: {}
            });
        }

        return res.status(200).json(fonteDestino);
    } catch (erro) {
        next(erro);
    }
});

// Criar uma fonte ou destino
router.post('/', async (req, res, next) => {
    try {
        const nome = typeof req.body.nome === 'string'
            ? req.body.nome.trim()
            : '';

        const {
            tipo,
            dia_fechamento,
            dia_vencimento,
            limite
        } = req.body;

        const campos = {};
        const tiposPermitidos = ['renda', 'conta', 'cartao_credito'];

        if (!nome || nome.length > 100) {
            campos.nome = 'O nome é obrigatório e deve ter no máximo 100 caracteres.';
        }

        if (!tiposPermitidos.includes(tipo)) {
            campos.tipo = 'O tipo deve ser renda, conta ou cartao_credito.';
        }

        let diaFechamento = null;
        let diaVencimento = null;
        let limiteCartao = null;

        if (tipo === 'cartao_credito') {
            if (
                !Number.isInteger(dia_fechamento) ||
                dia_fechamento < 1 ||
                dia_fechamento > 31
            ) {
                campos.dia_fechamento = 'Informe um dia de fechamento entre 1 e 31.';
            } else {
                diaFechamento = dia_fechamento;
            }

            if (
                !Number.isInteger(dia_vencimento) ||
                dia_vencimento < 1 ||
                dia_vencimento > 31
            ) {
                campos.dia_vencimento = 'Informe um dia de vencimento entre 1 e 31.';
            } else {
                diaVencimento = dia_vencimento;
            }

            if (
                typeof limite !== 'number' ||
                !Number.isFinite(limite) ||
                limite <= 0
            ) {
                campos.limite = 'Informe um limite maior que zero.';
            } else {
                limiteCartao = limite;
            }
        }

        if (Object.keys(campos).length > 0) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos
            });
        }

        const fonteDestino = await FonteDestino.criar({
            usuarioId: req.usuarioId,
            nome,
            tipo,
            diaFechamento,
            diaVencimento,
            limite: limiteCartao
        });

        return res.status(201).json(fonteDestino);
    } catch (erro) {
        next(erro);
    }
});

// Atualizar uma fonte ou destino
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const nome = typeof req.body.nome === 'string'
            ? req.body.nome.trim()
            : '';

        const {
            tipo,
            dia_fechamento,
            dia_vencimento,
            limite
        } = req.body;

        const campos = {};
        const tiposPermitidos = ['renda', 'conta', 'cartao_credito'];

        if (!Number.isInteger(id) || id <= 0) {
            campos.id = 'Informe um ID válido.';
        }

        if (!nome || nome.length > 100) {
            campos.nome = 'O nome é obrigatório e deve ter no máximo 100 caracteres.';
        }

        if (!tiposPermitidos.includes(tipo)) {
            campos.tipo = 'O tipo deve ser renda, conta ou cartao_credito.';
        }

        let diaFechamento = null;
        let diaVencimento = null;
        let limiteCartao = null;

        if (tipo === 'cartao_credito') {
            if (
                !Number.isInteger(dia_fechamento) ||
                dia_fechamento < 1 ||
                dia_fechamento > 31
            ) {
                campos.dia_fechamento = 'Informe um dia de fechamento entre 1 e 31.';
            } else {
                diaFechamento = dia_fechamento;
            }

            if (
                !Number.isInteger(dia_vencimento) ||
                dia_vencimento < 1 ||
                dia_vencimento > 31
            ) {
                campos.dia_vencimento = 'Informe um dia de vencimento entre 1 e 31.';
            } else {
                diaVencimento = dia_vencimento;
            }

            if (
                typeof limite !== 'number' ||
                !Number.isFinite(limite) ||
                limite <= 0
            ) {
                campos.limite = 'Informe um limite maior que zero.';
            } else {
                limiteCartao = limite;
            }
        }

        if (Object.keys(campos).length > 0) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos
            });
        }

        const fonteDestino = await FonteDestino.atualizar({
            id,
            usuarioId: req.usuarioId,
            nome,
            tipo,
            diaFechamento,
            diaVencimento,
            limite: limiteCartao
        });

        if (!fonteDestino) {
            return res.status(404).json({
                erro: 'Fonte ou destino não encontrado.',
                campos: {}
            });
        }

        return res.status(200).json(fonteDestino);
    } catch (erro) {
        next(erro);
    }
});

// Excluir uma fonte ou destino
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos: {
                    id: 'Informe um ID válido.'
                }
            });
        }

        const excluida = await FonteDestino.excluir(
            id,
            req.usuarioId
        );

        if (!excluida) {
            return res.status(404).json({
                erro: 'Fonte ou destino não encontrado.',
                campos: {}
            });
        }

        return res.status(200).json({
            mensagem: 'Fonte ou destino excluído com sucesso.'
        });
    } catch (erro) {
        if (erro.code === '23503') {
            return res.status(409).json({
                erro: 'Não é possível excluir uma fonte ou destino que possui lançamentos vinculados.',
                campos: {}
            });
        }

        next(erro);
    }
});

module.exports = router;
