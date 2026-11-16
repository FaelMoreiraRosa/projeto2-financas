
const express = require('express');
const router = express.Router();

const Categoria = require('../models/Categoria');
const autenticar = require('../middlewares/autenticar');

router.use(autenticar);

// Listar categorias do usuário autenticado
router.get('/', async (req, res, next) => {
    try {
        const { tipo } = req.query;

        if (tipo && !['entrada', 'saida'].includes(tipo)) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos: {
                    tipo: 'O tipo deve ser entrada ou saida.'
                }
            });
        }

        const categorias = await Categoria.listar(req.usuarioId, tipo);

        return res.status(200).json(categorias);
    } catch (erro) {
        next(erro);
    }
});

// Buscar uma categoria pelo ID
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

        const categoria = await Categoria.buscarPorId(id, req.usuarioId);

        if (!categoria) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.',
                campos: {}
            });
        }

        return res.status(200).json(categoria);
    } catch (erro) {
        next(erro);
    }
});

// Criar uma categoria
router.post('/', async (req, res, next) => {
    try {
        const nome = typeof req.body.nome === 'string'
            ? req.body.nome.trim()
            : '';

        const { tipo } = req.body;
        const campos = {};

        if (!nome || nome.length > 100) {
            campos.nome = 'O nome é obrigatório e deve ter no máximo 100 caracteres.';
        }

        if (!['entrada', 'saida'].includes(tipo)) {
            campos.tipo = 'O tipo deve ser entrada ou saida.';
        }

        if (Object.keys(campos).length > 0) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos
            });
        }

        const categoria = await Categoria.criar({
            usuarioId: req.usuarioId,
            nome,
            tipo
        });

        return res.status(201).json(categoria);
    } catch (erro) {
        if (erro.code === '23505') {
            return res.status(409).json({
                erro: 'Já existe uma categoria com esse nome e tipo.',
                campos: {}
            });
        }

        next(erro);
    }
});

// Atualizar uma categoria
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const nome = typeof req.body.nome === 'string'
            ? req.body.nome.trim()
            : '';

        const { tipo } = req.body;
        const campos = {};

        if (!Number.isInteger(id) || id <= 0) {
            campos.id = 'Informe um ID válido.';
        }

        if (!nome || nome.length > 100) {
            campos.nome = 'O nome é obrigatório e deve ter no máximo 100 caracteres.';
        }

        if (!['entrada', 'saida'].includes(tipo)) {
            campos.tipo = 'O tipo deve ser entrada ou saida.';
        }

        if (Object.keys(campos).length > 0) {
            return res.status(400).json({
                erro: 'Dados inválidos.',
                campos
            });
        }

        const categoria = await Categoria.atualizar({
            id,
            usuarioId: req.usuarioId,
            nome,
            tipo
        });

        if (!categoria) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.',
                campos: {}
            });
        }

        return res.status(200).json(categoria);
    } catch (erro) {
        if (erro.code === '23505') {
            return res.status(409).json({
                erro: 'Já existe uma categoria com esse nome e tipo.',
                campos: {}
            });
        }

        next(erro);
    }
});

// Excluir uma categoria
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

        const excluida = await Categoria.excluir(id, req.usuarioId);

        if (!excluida) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.',
                campos: {}
            });
        }

        return res.status(200).json({
            mensagem: 'Categoria excluída com sucesso.'
        });
    } catch (erro) {
        if (erro.code === '23503') {
            return res.status(409).json({
                erro: 'Não é possível excluir uma categoria que possui lançamentos vinculados.',
                campos: {}
            });
        }

        next(erro);
    }
});

module.exports = router;
