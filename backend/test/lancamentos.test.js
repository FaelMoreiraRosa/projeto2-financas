const test = require('node:test');
const assert = require('node:assert/strict');
const lancamentosRoutes = require('../src/routes/lancamentos.routes');

test('valida uma compra à vista sem aceitar usuarioId do corpo', () => {
    assert.equal(typeof lancamentosRoutes.validarPayload, 'function');
    const { campos, dados } = lancamentosRoutes.validarPayload({
        tipo: 'saida',
        descricao: 'Mercado',
        valor: '100.00',
        data: '2026-10-30',
        categoriaId: 2,
        fonteDestinoId: 3,
        usuarioId: 999
    });

    assert.deepEqual(campos, {});
    assert.equal(dados.totalParcelas, 1);
    assert.equal(Object.hasOwn(dados, 'usuarioId'), false);
});

test('aceita até 48 parcelas e rejeita valores fora do limite', () => {
    const base = {
        tipo: 'saida', descricao: 'Notebook', valor: '100.00', data: '2026-10-30',
        categoriaId: 2, fonteDestinoId: 3
    };

    assert.deepEqual(lancamentosRoutes.validarPayload({ ...base, totalParcelas: 48 }).campos, {});
    assert.ok(lancamentosRoutes.validarPayload({ ...base, totalParcelas: 49 }).campos.totalParcelas);
    assert.ok(lancamentosRoutes.validarPayload({ ...base, totalParcelas: 1.5 }).campos.totalParcelas);
});

test('rejeita datas inexistentes e valores com mais de duas casas', () => {
    const base = {
        tipo: 'saida', descricao: 'Mercado', valor: '100.001', data: '2026-02-30',
        categoriaId: 2, fonteDestinoId: 3
    };
    const { campos } = lancamentosRoutes.validarPayload(base);

    assert.ok(campos.data);
    assert.ok(campos.valor);
});

test('rejeita valores zero ou negativos e tipo de movimentação inválido', () => {
    const base = {
        tipo: 'saida', descricao: 'Compra', data: '2026-10-30', categoriaId: 2, fonteDestinoId: 3
    };

    for (const valor of ['0', '-0.01', '-20.00']) {
        assert.ok(lancamentosRoutes.validarPayload({ ...base, valor }).campos.valor, `valor ${valor}`);
    }

    assert.ok(lancamentosRoutes.validarPayload({ ...base, valor: '20.00', tipo: 'transferencia' }).campos.tipo);
});

test('rejeita parcelamento que produziria parcela de zero centavos', () => {
    const { campos } = lancamentosRoutes.validarPayload({
        tipo: 'saida', descricao: 'Compra', valor: '0.01', data: '2026-10-30',
        categoriaId: 2, fonteDestinoId: 3, totalParcelas: 2
    });

    assert.ok(campos.totalParcelas);
});
