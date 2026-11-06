function normalizarCpf(cpf) {
    return cpf.replace(/\D/g, '');
}

function validarCpf(cpf) {
    if (!cpf || cpf.length !== 11) {
        return false;
    }

    // Rejeita CPFs com todos os números iguais.
    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    function calcularDigito(parteCpf, pesoInicial) {
        let soma = 0;

        for (let i = 0; i < parteCpf.length; i++) {
            soma += Number(parteCpf[i]) * (pesoInicial - i);
        }

        const resto = (soma * 10) % 11;

        return resto === 10 ? 0 : resto;
    }

    const primeiroDigito = calcularDigito(cpf.slice(0, 9), 10);

    if (primeiroDigito !== Number(cpf[9])) {
        return false;
    }

    const segundoDigito = calcularDigito(cpf.slice(0, 10), 11);

    if (segundoDigito !== Number(cpf[10])) {
        return false;
    }

    return true;
}

function normalizarEmail(email) {
    return email.trim().toLowerCase();
}

function validarNome(nome) {
    return typeof nome === 'string' && nome.trim().length > 0;
}

function validarEmail(email) {
    if (typeof email !== 'string') {
        return false;
    }

    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(email);
}

function validarSenha(senha) {
    if (typeof senha !== 'string') {
        return false;
    }

    const temTamanhoMinimo = senha.length >= 8;
    const temLetra = /[a-zA-Z]/.test(senha);
    const temNumero = /\d/.test(senha);

    return temTamanhoMinimo && temLetra && temNumero;
}

module.exports = {
    normalizarCpf,
    validarCpf,
    normalizarEmail,
    validarNome,
    validarEmail,
    validarSenha
};