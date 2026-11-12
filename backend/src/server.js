require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const lancamentosRoutes = require('./routes/lancamentos.routes');
const tratarErros = require('./middlewares/tratarErros');

const app = express();

// Configurações e middlewares globais
app.use(cors({
    origin: process.env.FRONTEND_URL
}));

// IMPORTANTE: interpretar o JSON antes de chegar às rotas.
app.use(express.json());

// Rota inicial
app.get('/', (req, res) => {
    return res.status(200).json({
        mensagem: 'API de controle financeiro funcionando!'
    });
});

// Rotas de autenticação
app.use('/auth', authRoutes);

// Lançamentos financeiros
app.use('/api/lancamentos', lancamentosRoutes);

// Tratamento centralizado de erros: sempre por último.
app.use(tratarErros);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
