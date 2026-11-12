const bcrypt = require('bcrypt');
const { gerarToken } = require('../config/jwt');
const express = require('express');
const Usuario = require('../models/Usuario');
const autenticar = require('../middlewares/autenticar');
const rateLimit = require('express-rate-limit');

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


const limitarTentativasLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        campos: {}
    }
});


router.post('/login', limitarTentativasLogin, async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Verifica se os campos foram enviados corretamente.
        if (
            typeof email !== 'string' ||
            typeof senha !== 'string' ||
            !email.trim() ||
            !senha
        ) {
            return res.status(400).json({
                erro: 'E-mail e senha são obrigatórios.',
                campos: {}
            });
        }

        // Normaliza o e-mail.
        const emailNormalizado = normalizarEmail(email);

        // Busca o usuário pelo e-mail.
        const usuario = await Usuario.buscarPorEmail(emailNormalizado);

        // Verifica se o usuário existe.
        if (!usuario) {
            return res.status(401).json({
                erro: 'E-mail ou senha incorretos.',
                campos: {}
            });
        }

        // Compara a senha enviada com o hash armazenado.
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: 'E-mail ou senha incorretos.',
                campos: {}
            });
        }

        // Gera o token de autenticação.
        const token = gerarToken(usuario.id);

        // Retorna apenas os dados públicos do usuário.
        return res.status(200).json({
            mensagem: 'Login realizado com sucesso.',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cpf: usuario.cpf,
                criado_em: usuario.criado_em
            }
        });

    } catch (erro) {
        console.error('Erro ao realizar login:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao realizar login.',
            campos: {}
        });
    }
});

router.get('/perfil', autenticar, async (req, res) => {
    try {
        const usuario = await Usuario.buscarPorId(req.usuarioId);

        if (!usuario) {
            return res.status(404).json({
                erro: 'Usuário não encontrado.',
                campos: {}
            });
        }

        return res.status(200).json({
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cpf: usuario.cpf,
                criado_em: usuario.criado_em
            }
        });

    } catch (erro) {
        console.error('Erro ao buscar perfil:', erro);

        return res.status(500).json({
            erro: 'Erro interno ao buscar perfil.',
            campos: {}
        });
    }
});

module.exports = router;