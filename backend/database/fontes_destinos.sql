
CREATE TABLE fontes_destinos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL CHECK (length(trim(nome)) > 0),
    tipo VARCHAR(20) NOT NULL CHECK (
        tipo IN ('renda', 'conta', 'cartao_credito')
    ),
    dia_fechamento SMALLINT,
    dia_vencimento SMALLINT,
    limite NUMERIC(12, 2),

    CONSTRAINT chk_dados_cartao_credito CHECK (
    (
        tipo = 'cartao_credito'
        AND dia_fechamento IS NOT NULL
        AND dia_fechamento BETWEEN 1 AND 31
        AND dia_vencimento IS NOT NULL
        AND dia_vencimento BETWEEN 1 AND 31
        AND limite IS NOT NULL
        AND limite > 0
    )
    OR
    (
        tipo IN ('renda', 'conta')
        AND dia_fechamento IS NULL
        AND dia_vencimento IS NULL
        AND limite IS NULL
    )
    )
);
