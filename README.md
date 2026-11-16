# projeto2-financas

Aplicação full stack de controle financeiro desenvolvida com React, Node.js, Express e PostgreSQL.

## Banco de dados

Crie o banco `projeto2_financas` no PostgreSQL e execute os scripts nesta ordem, apenas na primeira configuração:

```powershell
psql -U postgres -d projeto2_financas -f backend/database/schema.sql
psql -U postgres -d projeto2_financas -f backend/database/lancamentos.sql
```

O `schema.sql` define usuários, categorias e fontes/destinos. O `lancamentos.sql` cria lançamentos e os campos de parcelamento. Não há dados de exemplo.

## Backend

Copie `backend/.env.example` para `backend/.env` e preencha localmente o usuário e a senha do PostgreSQL, além de um segredo para o JWT. Não envie `.env` ao GitHub.

```powershell
cd backend
npm ci
npm test
npm run dev
```

O servidor usa a porta `3000` por padrão. As rotas de lançamentos exigem `Authorization: Bearer <token>`.

## Frontend

```powershell
cd frontend
npm ci
npm run dev
```

O Vite usa `http://localhost:5173`. Para apontar a interface a outro endereço do backend, copie `frontend/.env.example` para `frontend/.env` e ajuste `VITE_API_URL`.

O `AuthContext` da Pessoa 1 guarda a sessão no `localStorage` ou `sessionStorage`; o serviço da API envia o token automaticamente. A tela de lançamentos consome `GET /api/categorias` e `GET /api/fontes-destinos`, conforme o contrato da Pessoa 2.

## Módulo da Pessoa 3

- Lançamentos: `GET/POST /api/lancamentos`, `GET/PUT/DELETE /api/lancamentos/:id`.
- Totais do período: `GET /api/lancamentos/resumo?inicio=AAAA-MM-DD&fim=AAAA-MM-DD`.
- Faturas atual e próximas três: `GET /api/relatorios/faturas?meses=3`.
- Testes de regras monetárias, datas de fatura e validações: `cd backend; npm test`.

O limite utilizado soma as parcelas cujo vencimento ainda não passou; a parcela com vencimento no dia atual continua comprometendo o limite até o fim desse dia. O limite disponível é o limite total menos esse valor. A edição de uma compra parcelada atualiza o grupo inteiro; se uma parcela tiver sido excluída individualmente, a edição retorna HTTP 409 para não redistribuir um grupo incompleto.
