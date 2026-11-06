require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');

const app = express();

// Permite receber requisições com corpo JSON.
app.use(express.json());

// Permite requisições somente da origem configurada.
app.use(cors({
    origin: process.env.FRONTEND_URL
}));

// Rota simples para verificar se a API está funcionando.
app.get('/', (req, res) => {
    res.status(200).json({
        mensagem: 'API de controle financeiro funcionando!'
    });
});

// Rotas de autenticação e cadastro.
app.use('/auth', authRoutes);

// Inicia o servidor.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});