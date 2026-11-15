const test = require('node:test');
const assert = require('node:assert/strict');
const Lancamento = require('../src/models/Lancamento');

test('divide o valor em centavos sem perder o total', () => {
    assert.deepEqual(
        Lancamento.dividirValorEmParcelas('100.00', 3),
        ['33.34', '33.33', '33.33']
    );
});

test('não permite parcelas com valor zero', () => {
    assert.throws(
        () => Lancamento.dividirValorEmParcelas('0.01', 2),
        /Cada parcela deve ter ao menos R\$ 0,01/
    );
});

test('compra no dia do fechamento entra na fatura seguinte', () => {
    assert.equal(Lancamento.calcularMesFatura('2026-10-09', 10), '2026-10');
    assert.equal(Lancamento.calcularMesFatura('2026-10-10', 10), '2026-11');
});

test('ajusta fechamento e vencimento para os dias disponíveis do mês', () => {
    assert.equal(Lancamento.calcularMesFatura('2026-02-28', 31), '2026-03');
    assert.deepEqual(
        Lancamento.calcularDatasFatura('2026-02', 31, 5),
        { fechamento: '2026-02-28', vencimento: '2026-03-05' }
    );
    assert.deepEqual(
        Lancamento.calcularDatasFatura('2026-10', 10, 20),
        { fechamento: '2026-10-10', vencimento: '2026-10-20' }
    );
});

test('distribui parcelas nas faturas mensais e calcula limite comprometido', () => {
    const cartoes = [{
        id: 7,
        nome: 'Cartão principal',
        dia_fechamento: 31,
        dia_vencimento: 5,
        limite: '500.00'
    }];
    const lancamentos = [1, 2, 3].map((parcela, index) => ({
        id: index + 1,
        fonte_destino_id: 7,
        descricao: 'Notebook',
        valor: ['33.34', '33.33', '33.33'][index],
        data: '2026-10-30',
        parcela_atual: parcela,
        total_parcelas: 3,
        grupo_parcelamento: 'grupo-notebook'
    }));

    const [cartao] = Lancamento.calcularFaturas(cartoes, lancamentos, '2026-10-15', 3);

    assert.deepEqual(cartao.faturas.map((fatura) => fatura.mes), [
        '2026-10', '2026-11', '2026-12', '2027-01'
    ]);
    assert.deepEqual(cartao.faturas.map((fatura) => fatura.total), [
        '33.34', '33.33', '33.33', '0.00'
    ]);
    assert.deepEqual(
        cartao.faturas.slice(0, 3).map((fatura) => fatura.lancamentos[0].parcelaAtual),
        [1, 2, 3]
    );
    assert.equal(cartao.limiteUtilizado, '100.00');
    assert.equal(cartao.limiteDisponivel, '400.00');
});

test('calcula entradas, saídas e saldo sem usar ponto flutuante', () => {
    assert.deepEqual(Lancamento.calcularResumo('3500.00', '1800.00'), {
        entradas: '3500.00',
        saidas: '1800.00',
        saldo: '1700.00'
    });
});

test('inclui a fatura do mês atual mesmo depois do fechamento', () => {
    const cartoes = [{ id: 9, nome: 'Cartão', dia_fechamento: 10, dia_vencimento: 20, limite: '100.00' }];
    const lancamentos = [
        { id: 1, fonte_destino_id: 9, descricao: 'Antes do fechamento', valor: '20.00', data: '2026-10-09', parcela_atual: 1, total_parcelas: 1 },
        { id: 2, fonte_destino_id: 9, descricao: 'No fechamento', valor: '30.00', data: '2026-10-10', parcela_atual: 1, total_parcelas: 1 }
    ];

    const [cartao] = Lancamento.calcularFaturas(cartoes, lancamentos, '2026-10-15', 3);

    assert.deepEqual(cartao.faturas.map((fatura) => fatura.mes), [
        '2026-10', '2026-11', '2026-12', '2027-01'
    ]);
    assert.equal(cartao.faturas[0].total, '20.00');
    assert.equal(cartao.faturas[1].total, '30.00');
});
