function centavos(valor) {
    const texto = String(valor);
    const partes = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(texto);

    if (!partes) throw new TypeError('Valor monetário inválido.');

    return BigInt(partes[1]) * 100n + BigInt((partes[2] || '').padEnd(2, '0'));
}

function formatarCentavos(valor) {
    const absoluto = valor < 0n ? -valor : valor;
    const texto = `${absoluto / 100n}.${String(absoluto % 100n).padStart(2, '0')}`;
    return valor < 0n ? `-${texto}` : texto;
}

function dividirValorEmParcelas(valor, totalParcelas) {
    if (!Number.isInteger(totalParcelas) || totalParcelas < 1 || totalParcelas > 48) {
        throw new RangeError('A quantidade de parcelas deve estar entre 1 e 48.');
    }

    const totalCentavos = centavos(valor);
    const quantidade = BigInt(totalParcelas);
    if (totalCentavos < quantidade) {
        throw new RangeError('Cada parcela deve ter ao menos R$ 0,01.');
    }
    const parcelaBase = totalCentavos / quantidade;
    const resto = Number(totalCentavos % quantidade);

    return Array.from({ length: totalParcelas }, (_, indice) =>
        formatarCentavos(parcelaBase + (indice < resto ? 1n : 0n))
    );
}

function calcularResumo(entradas, saidas) {
    const totalEntradas = centavos(entradas);
    const totalSaidas = centavos(saidas);

    return {
        entradas: formatarCentavos(totalEntradas),
        saidas: formatarCentavos(totalSaidas),
        saldo: formatarCentavos(totalEntradas - totalSaidas)
    };
}

function validarDia(dia) {
    if (!Number.isInteger(Number(dia)) || Number(dia) < 1 || Number(dia) > 31) {
        throw new RangeError('O dia do cartão deve estar entre 1 e 31.');
    }
    return Number(dia);
}

function lerData(data) {
    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        throw new TypeError('Data inválida.');
    }

    const [ano, mes, dia] = data.split('-').map(Number);
    const dataUTC = new Date(0);
    dataUTC.setUTCHours(0, 0, 0, 0);
    dataUTC.setUTCFullYear(ano, mes - 1, dia);

    if (
        ano < 1 || dataUTC.getUTCFullYear() !== ano ||
        dataUTC.getUTCMonth() !== mes - 1 || dataUTC.getUTCDate() !== dia
    ) {
        throw new TypeError('Data inválida.');
    }

    return { ano, mes, dia };
}

function diasNoMes(ano, mes) {
    return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function avancarMes(mes, quantidade = 1) {
    const [ano, numeroMes] = mes.split('-').map(Number);
    const data = new Date(Date.UTC(ano, numeroMes - 1 + quantidade, 1));
    return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}

function dataNoMes(mes, dia) {
    if (typeof mes !== 'string' || !/^\d{4}-\d{2}$/.test(mes)) {
        throw new TypeError('Mês inválido.');
    }

    const [ano, numeroMes] = mes.split('-').map(Number);
    if (numeroMes < 1 || numeroMes > 12 || ano < 1) throw new TypeError('Mês inválido.');

    const diaReal = Math.min(validarDia(dia), diasNoMes(ano, numeroMes));
    return `${mes}-${String(diaReal).padStart(2, '0')}`;
}

function calcularMesFatura(dataCompra, diaFechamento) {
    const { ano, mes, dia } = lerData(dataCompra);
    const fechamento = Math.min(validarDia(diaFechamento), diasNoMes(ano, mes));
    const mesCompra = `${ano}-${String(mes).padStart(2, '0')}`;
    return dia >= fechamento ? avancarMes(mesCompra) : mesCompra;
}

function calcularDatasFatura(mes, diaFechamento, diaVencimento) {
    const fechamentoDia = validarDia(diaFechamento);
    const vencimentoDia = validarDia(diaVencimento);
    const fechamento = dataNoMes(mes, fechamentoDia);
    const mesVencimento = vencimentoDia > fechamentoDia ? mes : avancarMes(mes);

    return {
        fechamento,
        vencimento: dataNoMes(mesVencimento, vencimentoDia)
    };
}

function calcularFaturas(cartoes, lancamentos, hoje, mesesFuturos = 3) {
    const dataHoje = lerData(hoje);
    if (!Number.isInteger(mesesFuturos) || mesesFuturos < 0 || mesesFuturos > 48) {
        throw new RangeError('A quantidade de meses deve estar entre 0 e 48.');
    }

    return cartoes.map((cartao) => {
        const diaFechamento = validarDia(cartao.dia_fechamento);
        const diaVencimento = validarDia(cartao.dia_vencimento);
        const mesAtual = `${dataHoje.ano}-${String(dataHoje.mes).padStart(2, '0')}`;
        const primeiroMes = mesAtual;
        const faturas = Array.from({ length: mesesFuturos + 1 }, (_, indice) => {
            const mes = avancarMes(primeiroMes, indice);
            return {
                mes,
                ...calcularDatasFatura(mes, diaFechamento, diaVencimento),
                total: 0n,
                lancamentos: []
            };
        });
        const porMes = new Map(faturas.map((fatura) => [fatura.mes, fatura]));
        let limiteUtilizadoCentavos = 0n;

        for (const lancamento of lancamentos) {
            if (Number(lancamento.fonte_destino_id) !== Number(cartao.id)) continue;

            const mesPrimeiraParcela = calcularMesFatura(lancamento.data, diaFechamento);
            const parcelaAtual = Number(lancamento.parcela_atual || 1);
            const totalParcelas = Number(lancamento.total_parcelas || 1);
            const mes = totalParcelas > 1
                ? avancarMes(mesPrimeiraParcela, parcelaAtual - 1)
                : mesPrimeiraParcela;
            const valorCentavos = centavos(lancamento.valor);
            const datas = calcularDatasFatura(mes, diaFechamento, diaVencimento);

            if (datas.vencimento >= hoje) limiteUtilizadoCentavos += valorCentavos;

            const fatura = porMes.get(mes);
            if (!fatura) continue;

            fatura.total += valorCentavos;
            fatura.lancamentos.push({
                id: lancamento.id,
                descricao: lancamento.descricao,
                categoria: lancamento.categoria_nome || null,
                valor: formatarCentavos(valorCentavos),
                parcelaAtual,
                totalParcelas
            });
        }

        const limiteCentavos = centavos(cartao.limite);

        return {
            id: cartao.id,
            nome: cartao.nome,
            limite: formatarCentavos(limiteCentavos),
            limiteUtilizado: formatarCentavos(limiteUtilizadoCentavos),
            limiteDisponivel: formatarCentavos(limiteCentavos - limiteUtilizadoCentavos),
            faturas: faturas.map((fatura) => ({
                ...fatura,
                total: formatarCentavos(fatura.total)
            }))
        };
    });
}

module.exports = {
    dividirValorEmParcelas,
    calcularResumo,
    calcularMesFatura,
    calcularDatasFatura,
    calcularFaturas
};
