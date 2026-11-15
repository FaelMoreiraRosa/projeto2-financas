# Pessoa 3 Lançamentos, Parcelamentos e Faturas Implementation Plan

> **For Codex:** execute task by task in this session, preserving the existing Pessoa 3 branch and local schema edit.

**Goal:** Complete Pessoa 3's backend and React interfaces for launches, installments, summaries, and credit card invoices according to `Projeto 2 Pessoa 3.docx`.

**Architecture:** Keep SQL in `backend/src/models`, controllers inside route files, and use the existing PostgreSQL pool and JWT middleware. Represent each installment as a row in `lancamentos`, keep the original purchase date and shared group UUID, and derive invoice months from the first installment plus `parcela_atual`; avoid a schema change unless the required behavior cannot be represented. Add a React/Vite frontend under `frontend/src` that consumes the documented Pessoa 1/Pessoa 2 API contracts and shows loading, empty, and error states.

**Tech Stack:** Node.js, Express, PostgreSQL, React, Vite, native `node:test`, native `fetch`.

---

### Task 1: Pure money and invoice rules

**Files:**
- Create: `backend/src/models/financeiro.js`
- Create: `backend/test/financeiro.test.js`
- Modify: `backend/package.json`

Write failing tests for centavo-safe installment splits, close-day boundaries, month-end clamping, next-installment scheduling, and invoice/limit totals. Implement the smallest pure helpers and run `node --test`.

### Task 2: Launch backend completion

**Files:**
- Modify: `backend/src/routes/lancamentos.routes.js`
- Modify: `backend/src/models/Lancamento.js`
- Create: `backend/src/routes/faturas.routes.js`
- Create: `backend/src/models/Fatura.js`
- Modify: `backend/src/server.js`
- Modify: `backend/test/lancamentos.test.js`

Test payload validation first. Add transactional creation and coherent group updates, explicit single/group deletion behavior, current-period totals, and `GET /api/relatorios/faturas?meses=3`. Retain owner scoping and parameterized SQL.

### Task 3: Pessoa 3 React screens

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/services/api.js`
- Create: `frontend/src/components/Lancamentos.jsx`
- Create: `frontend/src/components/Faturas.jsx`
- Create: `frontend/src/styles.css`

Build dashboard totals, launch form/list/filter/pagination/edit/delete, installment indicators and deletion choice, and current/next-three invoice views. Consume `/api/categorias` and `/api/fontes-destinos`; do not seed or fabricate rows. Run the Vite production build.

### Task 4: Local setup and delivery notes

**Files:**
- Modify: `README.md`
- Preserve: `backend/database/schema.sql` and `backend/database/lancamentos.sql`

Document startup, required local environment variables, API contracts, and the fact that Pessoa 2 endpoints must exist at integration time. Do not put the local database password in versioned files. Review status and commit/push only the finished Pessoa 3 work.
