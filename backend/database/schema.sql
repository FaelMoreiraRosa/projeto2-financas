CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    cpf CHAR(11) NOT NULL UNIQUE,
    senha_hash VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);nano src/models/Usuari