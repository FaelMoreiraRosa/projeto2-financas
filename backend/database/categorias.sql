CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL CHECK (length(trim(nome)) > 0),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    CONSTRAINT uq_categorias_usuario_nome_tipo
        UNIQUE (usuario_id, nome, tipo)
);