
import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/useAuth'
import './Relatorios.css'

function RelatoriosFontesDestinos() {
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
        const endpoint = `/api/relatorios/fontes-destinos${query ? `?${query}` : ''}`

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

  const totalEntradas = relatorios.reduce(
    (total, item) => total + Number(item.total_entradas || 0),
    0,
  )

  const totalSaidas = relatorios.reduce(
    (total, item) => total + Number(item.total_saidas || 0),
    0,
  )

  function limparFiltros() {
    setInicio('')
    setFim('')
  }

  function nomeTipo(valor) {
    const tipos = {
      renda: 'Fonte de renda',
      conta: 'Conta',
      cartao_credito: 'Cartão de crédito',
    }

    return tipos[valor] || valor
  }

  return (
    <main className="relatorios-page">
      <header className="relatorios-header">
        <div>
          <span className="relatorios-eyebrow">ANÁLISE FINANCEIRA</span>
          <h1>Relatório por fontes e destinos</h1>
          <p>
            Acompanhe as entradas e saídas agrupadas por suas fontes e destinos.
          </p>
        </div>
      </header>

      <section className="relatorios-filtros">
        <div className="relatorio-campo">
          <label htmlFor="fontes-relatorio-inicio">Data inicial</label>
          <input
            id="fontes-relatorio-inicio"
            type="date"
            value={inicio}
            max={fim || undefined}
            onChange={(event) => setInicio(event.target.value)}
          />
        </div>

        <div className="relatorio-campo">
          <label htmlFor="fontes-relatorio-fim">Data final</label>
          <input
            id="fontes-relatorio-fim"
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
          <span>Cadastros encontrados</span>
          <strong>{relatorios.length}</strong>
        </article>

        <article className="relatorio-resumo-card">
          <span>Total de lançamentos</span>
          <strong>{totalLancamentos}</strong>
        </article>

        <article className="relatorio-resumo-card">
          <span>Total de entradas</span>
          <strong>{formatarMoeda(totalEntradas)}</strong>
        </article>

        <article className="relatorio-resumo-card">
          <span>Total de saídas</span>
          <strong>{formatarMoeda(totalSaidas)}</strong>
        </article>
      </section>

      <section className="relatorio-tabela-card">
        <div className="relatorio-tabela-header">
          <div>
            <h2>Detalhamento por fonte e destino</h2>
            <p>Movimentações agrupadas por cada cadastro financeiro.</p>
          </div>
        </div>

        {carregando ? (
          <p className="relatorio-vazio">Carregando relatório...</p>
        ) : relatorios.length === 0 ? (
          <div className="relatorio-vazio">
            <span>📊</span>
            <strong>Nenhum dado encontrado</strong>
            <p>Não há fontes ou destinos para o período selecionado.</p>
          </div>
        ) : (
          <div className="relatorio-tabela-scroll">
            <table className="relatorio-tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Lançamentos</th>
                  <th>Entradas</th>
                  <th>Saídas</th>
                </tr>
              </thead>

              <tbody>
                {relatorios.map((item) => (
                  <tr key={item.fonte_destino_id}>
                    <td>{item.fonte_destino}</td>
                    <td>{nomeTipo(item.tipo_fonte_destino)}</td>
                    <td>{item.quantidade_lancamentos}</td>
                    <td className="relatorio-valor">
                      {formatarMoeda(item.total_entradas)}
                    </td>
                    <td className="relatorio-valor">
                      {formatarMoeda(item.total_saidas)}
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

export default RelatoriosFontesDestinos
