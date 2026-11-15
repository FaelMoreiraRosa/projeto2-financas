const express = require('express');
const autenticar = require('../middlewares/autenticar');
const Lancamento = require('../models/Lancamento');

const router = express.Router();
router.use(autenticar);

function dataValida(valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return false;
    }

    const [ano, mes, dia] = valor.split('-').map(Number);
    if (ano < 1) return false;
    const data = new Date(0);
    data.setUTCFullYear(ano, mes - 1, dia);

    return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

function idPositivo(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 && id <= 2147483647;
}

function validarPayload(body = {}) {
    body = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const campos = {};
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
    const valor = typeof body.valor === 'number' ? String(body.valor) : body.valor;
    const categoriaId = Number(body.categoriaId);
    const fonteDestinoId = Number(body.fonteDestinoId);
    const totalParcelas = body.totalParcelas === undefined ? 1 : Number(body.totalParcelas);
    const valorValido = typeof valor === 'string' &&
        /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(valor) && Number(valor) > 0;

    if (!['entrada', 'saida'].includes(body.tipo)) {
        campos.tipo = 'Informe entrada ou saida.';
    }
    if (!descricao || descricao.length > 255) {
        campos.descricao = 'A descrição deve ter entre 1 e 255 caracteres.';
    }
    if (!valorValido) {
        campos.valor = 'Informe um valor maior que zero, com até duas casas decimais.';
    }
    if (!dataValida(body.data)) {
        campos.data = 'Informe uma data válida no formato AAAA-MM-DD.';
    }
    if (!idPositivo(categoriaId)) {
        campos.categoriaId = 'Selecione uma categoria válida.';
    }
    if (!idPositivo(fonteDestinoId)) {
        campos.fonteDestinoId = 'Selecione uma fonte ou destino válido.';
    }
    if (!Number.isInteger(totalParcelas) || totalParcelas < 1 || totalParcelas > 48) {
        campos.totalParcelas = 'A quantidade deve estar entre 1 e 48.';
    } else if (valorValido) {
        try {
            Lancamento.dividirValorEmParcelas(valor, totalParcelas);
        } catch (erro) {
            campos.totalParcelas = 'Cada parcela deve ter ao menos R$ 0,01.';
        }
    }

    return {
        campos,
        dados: { tipo: body.tipo, descricao, valor, data: body.data, categoriaId, fonteDestinoId, totalParcelas }
    };
}

async function validarRelacionados(usuarioId, dados, res) {
    const categoria = await Lancamento.buscarCategoria(usuarioId, dados.categoriaId);

    if (!categoria) {
        res.status(404).json({ erro: 'Categoria não encontrada.', campos: { categoriaId: 'Categoria indisponível.' } });
        return false;
    }
    if (categoria.tipo !== dados.tipo) {
        res.status(400).json({ erro: 'Verifique os dados informados.', campos: { categoriaId: 'A categoria não corresponde ao tipo do lançamento.' } });
        return false;
    }
    const fonteDestino = await Lancamento.buscarFonteDestino(usuarioId, dados.fonteDestinoId);
    if (!fonteDestino) {
        res.status(404).json({ erro: 'Fonte ou destino não encontrado.', campos: { fonteDestinoId: 'Fonte ou destino indisponível.' } });
        return false;
    }
    if (dados.totalParcelas > 1 && (dados.tipo !== 'saida' || fonteDestino.tipo !== 'cartao_credito')) {
        res.status(400).json({
            erro: 'Verifique os dados informados.',
            campos: { totalParcelas: 'Parcelamento disponível somente para saídas no cartão de crédito.' }
        });
        return false;
    }

    return true;
}

router.get('/', async (req, res) => {
    try {
        const filtros = {};
        const campos = {};
        const temFiltro = ['inicio', 'fim', 'tipo', 'categoriaId', 'fonteDestinoId']
            .some((campo) => req.query[campo] !== undefined);

        if (!temFiltro) {
            const hoje = new Date();
            const ano = hoje.getUTCFullYear();
            const mes = String(hoje.getUTCMonth() + 1).padStart(2, '0');
            const ultimoDia = new Date(Date.UTC(ano, hoje.getUTCMonth() + 1, 0)).getUTCDate();
            filtros.inicio = `${ano}-${mes}-01`;
            filtros.fim = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
        } else {
            for (const campo of ['inicio', 'fim']) {
                if (req.query[campo] !== undefined) {
                    if (!dataValida(req.query[campo])) campos[campo] = 'Informe uma data válida no formato AAAA-MM-DD.';
                    else filtros[campo] = req.query[campo];
                }
            }
            if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) {
                campos.fim = 'A data final deve ser igual ou posterior à inicial.';
            }
            if (req.query.tipo !== undefined) {
                if (!['entrada', 'saida'].includes(req.query.tipo)) campos.tipo = 'Informe entrada ou saida.';
                else filtros.tipo = req.query.tipo;
            }
            for (const [campo, filtro] of [['categoriaId', 'categoriaId'], ['fonteDestinoId', 'fonteDestinoId']]) {
                if (req.query[campo] !== undefined) {
                    if (!idPositivo(req.query[campo])) campos[campo] = 'Informe um identificador válido.';
                    else filtros[filtro] = Number(req.query[campo]);
                }
            }
        }

        const pagina = req.query.pagina === undefined ? 1 : Number(req.query.pagina);
        if (!Number.isSafeInteger(pagina) || pagina < 1 || pagina > 2147483647) {
            campos.pagina = 'Informe uma página válida.';
        }
        if (Object.keys(campos).length) {
            return res.status(400).json({ erro: 'Verifique os filtros informados.', campos });
        }

        const resultado = await Lancamento.listar(req.usuarioId, { ...filtros, pagina });
        return res.status(200).json(resultado);
    } catch (erro) {
        console.error('Erro ao listar lançamentos:', erro);
        return res.status(500).json({ erro: 'Erro interno ao listar lançamentos.', campos: {} });
    }
});

router.get('/resumo', async (req, res) => {
    try {
        const campos = {};
        const filtros = {};
        const temPeriodo = req.query.inicio !== undefined || req.query.fim !== undefined;

        if (!temPeriodo) {
            const hoje = new Date();
            const ano = hoje.getUTCFullYear();
            const mes = String(hoje.getUTCMonth() + 1).padStart(2, '0');
            const ultimoDia = new Date(Date.UTC(ano, hoje.getUTCMonth() + 1, 0)).getUTCDate();
            filtros.inicio = `${ano}-${mes}-01`;
            filtros.fim = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
        } else {
            for (const campo of ['inicio', 'fim']) {
                if (req.query[campo] !== undefined) {
                    if (!dataValida(req.query[campo])) campos[campo] = 'Informe uma data válida no formato AAAA-MM-DD.';
                    else filtros[campo] = req.query[campo];
                }
            }
            if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) {
                campos.fim = 'A data final deve ser igual ou posterior à inicial.';
            }
        }

        if (Object.keys(campos).length) {
            return res.status(400).json({ erro: 'Verifique os filtros informados.', campos });
        }

        const totais = await Lancamento.resumir(req.usuarioId, filtros);
        const resumo = Lancamento.calcularResumo(totais.entradas, totais.saidas);
        return res.status(200).json({ ...filtros, ...resumo });
    } catch (erro) {
        console.error('Erro ao calcular resumo financeiro:', erro);
        return res.status(500).json({ erro: 'Erro interno ao calcular o resumo financeiro.', campos: {} });
    }
});

router.get('/:id', async (req, res) => {
    try {
        if (!idPositivo(req.params.id)) {
            return res.status(400).json({ erro: 'Identificador inválido.', campos: {} });
        }

        const lancamento = await Lancamento.buscarPorId(Number(req.params.id), req.usuarioId);
        if (!lancamento) {
            return res.status(404).json({ erro: 'Lançamento não encontrado.', campos: {} });
        }

        return res.status(200).json(lancamento);
    } catch (erro) {
        console.error('Erro ao buscar lançamento:', erro);
        return res.status(500).json({ erro: 'Erro interno ao buscar lançamento.', campos: {} });
    }
});

router.post('/', async (req, res) => {
    try {
        const { campos, dados } = validarPayload(req.body);
        if (Object.keys(campos).length) {
            return res.status(400).json({ erro: 'Verifique os dados informados.', campos });
        }
        if (!await validarRelacionados(req.usuarioId, dados, res)) return;

        const lancamento = await Lancamento.criar({ ...dados, usuarioId: req.usuarioId });
        return res.status(201).json(lancamento);
    } catch (erro) {
        console.error('Erro ao criar lançamento:', erro);
        return res.status(500).json({ erro: 'Erro interno ao criar lançamento.', campos: {} });
    }
});

router.put('/:id', async (req, res) => {
    try {
        if (!idPositivo(req.params.id)) {
            return res.status(400).json({ erro: 'Identificador inválido.', campos: {} });
        }

        const id = Number(req.params.id);
        const existente = await Lancamento.buscarPorId(id, req.usuarioId);
        if (!existente) {
            return res.status(404).json({ erro: 'Lançamento não encontrado.', campos: {} });
        }
        if (existente.total_parcelas > 1 && !existente.grupo_completo) {
            return res.status(409).json({
                erro: 'Não é possível editar uma compra após excluir uma parcela individual.',
                campos: {}
            });
        }
        const { campos, dados } = validarPayload(req.body);
        if (Object.keys(campos).length) {
            return res.status(400).json({ erro: 'Verifique os dados informados.', campos });
        }
        if (!await validarRelacionados(req.usuarioId, dados, res)) return;

        const lancamento = await Lancamento.atualizar({ ...dados, id, usuarioId: req.usuarioId });
        if (!lancamento) {
            return res.status(404).json({ erro: 'Lançamento não encontrado.', campos: {} });
        }
        return res.status(200).json(lancamento);
    } catch (erro) {
        console.error('Erro ao atualizar lançamento:', erro);
        return res.status(500).json({ erro: 'Erro interno ao atualizar lançamento.', campos: {} });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        if (!idPositivo(req.params.id)) {
            return res.status(400).json({ erro: 'Identificador inválido.', campos: {} });
        }

        const id = Number(req.params.id);
        const existente = await Lancamento.buscarPorId(id, req.usuarioId);
        if (!existente) {
            return res.status(404).json({ erro: 'Lançamento não encontrado.', campos: {} });
        }
        const escopo = req.query.escopo;
        if (existente.total_parcelas > 1 && !['parcela', 'grupo'].includes(escopo)) {
            return res.status(400).json({
                erro: 'Escolha o escopo da exclusão.',
                campos: { escopo: 'Use parcela para excluir somente esta parcela ou grupo para excluir a compra toda.' }
            });
        }
        if (existente.total_parcelas === 1 && escopo && escopo !== 'parcela') {
            return res.status(400).json({ erro: 'Escopo de exclusão inválido.', campos: { escopo: 'Use parcela.' } });
        }

        await Lancamento.excluir(id, req.usuarioId, escopo || 'parcela');
        return res.status(204).send();
    } catch (erro) {
        console.error('Erro ao excluir lançamento:', erro);
        return res.status(500).json({ erro: 'Erro interno ao excluir lançamento.', campos: {} });
    }
});

router.validarPayload = validarPayload;
module.exports = router;
