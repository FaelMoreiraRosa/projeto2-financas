const express = require('express');
const Usuario = require('../models/Usuario');

const {
    normalizarCpf,
    validarCpf,
    normalizarEmail,
    validarNome,
    validarEmail,
    validarSenha
} = require('../config/validacoes');

const router = express.Router();

router.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, cpf, senha } = req.body;

        // Verifica os campos obrigatórios.
        if (
            typeof nome !== 'string' ||
            typeof email !== 'string' ||
            typeof cpf !== 'string' ||
            typeof senha !== 'string'
        ) {
            return res.status(400).json({
                erro: 'Todos os campos são obrigatórios.',
                campos: {}
            });
        }

        // Normaliza os dados antes de validar.
        const nomeNormalizado = nome.trim();
        const emailNormalizado = normalizarEmail(email);
        const cpfNormalizado = normalizarCpf(cpf);

        // Armazena os erros encontrados por campo.
        const campos = {};

        if (!validarNome(nomeNormalizado)) {
            campos.nome = 'Informe um nome válido.';
        }

        if (!validarEmail(emailNormalizado)) {
            campos.email = 'Informe um e-mail válido.';
        }

        if (!validarCpf(cpfNormalizado)) {
            campos.cpf = 'Informe um CPF válido.';
        }

        if (!validarSenha(senha)) {
            campos.senha =
                'A senha deve ter pelo menos 8 caracteres, incluindo letras e números.';
        }

        // Se houver algum erro, interrompe o cadastro.
        if (Object.keys(campos).length > 0) {
            return res.status(400).json({
                erro: 'Verifique os dados informados.',
                campos
            });
        }

        // Tenta cadastrar o usuário no banco.
        const usuario = await Usuario.criar({
            nome: nomeNormalizado,
            email: emailNormalizado,
            cpf: cpfNormalizado,
            senha
        });

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso.',
            usuario
        });

    } catch (erro) {
        // Trata violações de UNIQUE do PostgreSQL.
        if (erro.code === '23505') {
            if (erro.constraint === 'usuarios_email_key') {
                return res.status(409).json({
                    erro: 'Este e-mail já está cadastrado.',
                    campos: {
                        email: 'Utilize outro e-mail.'
                    }
                });
            }

            if (erro.constraint === 'usuarios_cpf_key') {
                return res.status(409).json({
                    erro: 'Este CPF já está cadastrado.',
                    campos: {
                        cpf: 'Este CPF já pertence a uma conta.'
                    }
                });
            }
        }

        console.error('Erro ao cadastrar usuário:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao cadastrar usuário.',
            campos: {}
        });
    }
});

module.exports = router;