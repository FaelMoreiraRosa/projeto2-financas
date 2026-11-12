-- Execute depois das tabelas categorias e fontes_destinos da Pessoa 2.
CREATE TABLE lancamentos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    descricao VARCHAR(255) NOT NULL CHECK (length(trim(descricao)) > 0),
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    data DATE NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    fonte_destino_id INTEGER NOT NULL REFERENCES fontes_destinos(id),
    parcela_atual INTEGER NOT NULL DEFAULT 1,
    total_parcelas INTEGER NOT NULL DEFAULT 1 CHECK (total_parcelas BETWEEN 1 AND 48),
    grupo_parcelamento UUID,
    CHECK (parcela_atual BETWEEN 1 AND total_parcelas),
    CHECK (
        (total_parcelas = 1 AND parcela_atual = 1 AND grupo_parcelamento IS NULL)
        OR (total_parcelas > 1 AND grupo_parcelamento IS NOT NULL)
    )
);

CREATE INDEX idx_lancamentos_usuario_data
    ON lancamentos (usuario_id, data DESC);
