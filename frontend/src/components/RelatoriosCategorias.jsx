
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/useAuth'
import './Relatorios.css'

function RelatoriosCategorias() {
  const { token } = useAuth()

  const [relatorios, setRelatorios] = useState([])
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarRelatorio() {
      setCarregando(true)
      setErro('')

      try {
        const parametros = new URLSearchParams()

        if (inicio) parametros.append('inicio', inicio)
        if (fim) parametros.append('fim', fim)

        const query = parametros.toString()
        const endpoint = `/api/relatorios/categorias${query ? `?${query}` : ''}`

        const dados = await apiRequest(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (ativo) {
          setRelatorios(
            Array.isArray(dados) ? dados : dados.relatorios || [],
          )
        }
      } catch (error) {
        if (ativo) {
          setErro(error.message || 'Não foi possível carregar o relatório.')
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    carregarRelatorio()

    return () => {
      ativo = false
    }
  }, [token, inicio, fim])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const totalLancamentos = relatorios.reduce(
    (total, item) => total + Number(item.quantidade_lancamentos || 0),
    0,
  )

  const totalValores = relatorios.reduce(
    (total, item) => total + Number(item.total || 0),
    0,
  )

  function limparFiltros() {
    setInicio('')
    setFim('')
  }

  return (
    <main className="relatorios-page">
      <header className="relatorios-header">
        <div>
          <span className="relatorios-eyebrow">ANÁLISE FINANCEIRA</span>
          <h1>Relatório por categorias</h1>
          <p>Visualize suas movimentações agrupadas por categoria.</p>
        </div>
      </header>

      <section className="relatorios-filtros">
        <div className="relatorio-campo">
          <label htmlFor="relatorio-inicio">Data inicial</label>
          <input
            id="relatorio-inicio"
            type="date"
            value={inicio}
            max={fim || undefined}
            onChange={(event) => setInicio(event.target.value)}
          />
        </div>

        <div className="relatorio-campo">
          <label htmlFor="relatorio-fim">Data final</label>
          <input
            id="relatorio-fim"
            type="date"
            value={fim}
            min={inicio || undefined}
            onChange={(event) => setFim(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="relatorio-limpar"
          onClick={limparFiltros}
        >
          Limpar filtros
        </button>
      </section>

      {erro && <div className="relatorio-erro">{erro}</div>}

      <section className="relatorios-resumo">
        <article className="relatorio-resumo-card">
          <span>Categorias encontradas</span>
          <strong>{relatorios.length}</strong>
        </article>

        <article className="relatorio-resumo-card">
          <span>Total de lançamentos</span>
          <strong>{totalLancamentos}</strong>
        </article>

        <article className="relatorio-resumo-card">
          <span>Valor total movimentado</span>
          <strong>{formatarMoeda(totalValores)}</strong>
        </article>
      </section>

      <section className="relatorio-tabela-card">
        <div className="relatorio-tabela-header">
          <div>
            <h2>Detalhamento por categoria</h2>
            <p>Valores agrupados conforme o tipo de movimentação.</p>
          </div>
        </div>

        {carregando ? (
          <p className="relatorio-vazio">Carregando relatório...</p>
        ) : relatorios.length === 0 ? (
          <div className="relatorio-vazio">
            <span>📊</span>
            <strong>Nenhum dado encontrado</strong>
            <p>Não há categorias para o período selecionado.</p>
          </div>
        ) : (
          <div className="relatorio-tabela-scroll">
            <table className="relatorio-tabela">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Valor total</th>
                </tr>
              </thead>

              <tbody>
                {relatorios.map((item) => (
                  <tr key={item.categoria_id}>
                    <td>{item.categoria}</td>
                    <td>
                      <span className={`relatorio-tipo ${item.tipo}`}>
                        {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td>{item.quantidade_lancamentos}</td>
                    <td className="relatorio-valor">
                      {formatarMoeda(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default RelatoriosCategorias
