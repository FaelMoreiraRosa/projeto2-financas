
import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/useAuth'
import './FontesDestinos.css'

function FontesDestinos() {
  const { token } = useAuth()

  const [itens, setItens] = useState([])
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('renda')
  const [diaFechamento, setDiaFechamento] = useState('')
  const [diaVencimento, setDiaVencimento] = useState('')
  const [limite, setLimite] = useState('')
  const [itemEditando, setItemEditando] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const carregarItens = useCallback(async () => {
    try {
      const dados = await apiRequest('/api/fontes-destinos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setItens(
        Array.isArray(dados)
          ? dados
          : dados.fontesDestinos || dados.fontes_destinos || [],
      )
      setErro('')
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar os cadastros.')
    } finally {
      setCarregando(false)
    }
  }, [token])

  useEffect(() => {
    let ativo = true

    async function carregarInicialmente() {
      try {
        const dados = await apiRequest('/api/fontes-destinos', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (ativo) {
          setItens(
            Array.isArray(dados)
              ? dados
              : dados.fontesDestinos || dados.fontes_destinos || [],
          )
          setErro('')
        }
      } catch (error) {
        if (ativo) {
          setErro(error.message || 'Não foi possível carregar os cadastros.')
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    carregarInicialmente()

    return () => {
      ativo = false
    }
  }, [token])

  function limparFormulario() {
    setNome('')
    setTipo('renda')
    setDiaFechamento('')
    setDiaVencimento('')
    setLimite('')
    setItemEditando(null)
    setErro('')
  }

  async function salvarItem(event) {
    event.preventDefault()

    setErro('')
    setMensagem('')

    if (!nome.trim()) {
      setErro('Informe o nome da fonte ou destino.')
      return
    }

    const dados = {
      nome: nome.trim(),
      tipo,
      dia_fechamento: tipo === 'cartao_credito' ? Number(diaFechamento) : null,
      dia_vencimento: tipo === 'cartao_credito' ? Number(diaVencimento) : null,
      limite: tipo === 'cartao_credito' ? Number(limite) : null,
    }

    if (tipo === 'cartao_credito') {
      if (
        !Number.isInteger(dados.dia_fechamento) ||
        dados.dia_fechamento < 1 ||
        dados.dia_fechamento > 31
      ) {
        setErro('Informe um dia de fechamento entre 1 e 31.')
        return
      }

      if (
        !Number.isInteger(dados.dia_vencimento) ||
        dados.dia_vencimento < 1 ||
        dados.dia_vencimento > 31
      ) {
        setErro('Informe um dia de vencimento entre 1 e 31.')
        return
      }

      if (!Number.isFinite(dados.limite) || dados.limite <= 0) {
        setErro('Informe um limite válido para o cartão.')
        return
      }
    }

    setSalvando(true)

    try {
      const editando = itemEditando !== null

      await apiRequest(
        editando
          ? `/api/fontes-destinos/${itemEditando.id}`
          : '/api/fontes-destinos',
        {
          method: editando ? 'PUT' : 'POST',
          headers,
          body: JSON.stringify(dados),
        },
      )

      limparFormulario()
      setMensagem(
        editando
          ? 'Cadastro atualizado com sucesso!'
          : 'Cadastro realizado com sucesso!',
      )

      await carregarItens()
    } catch (error) {
      setErro(error.message || 'Não foi possível salvar o cadastro.')
    } finally {
      setSalvando(false)
    }
  }

  function editarItem(item) {
    setItemEditando(item)
    setNome(item.nome)
    setTipo(item.tipo)
    setDiaFechamento(item.dia_fechamento ?? '')
    setDiaVencimento(item.dia_vencimento ?? '')
    setLimite(item.limite ?? '')
    setErro('')
    setMensagem('')
  }

  async function excluirItem(item) {
    const confirmar = window.confirm(
      `Deseja realmente excluir "${item.nome}"?`,
    )

    if (!confirmar) return

    setErro('')
    setMensagem('')

    try {
      await apiRequest(`/api/fontes-destinos/${item.id}`, {
        method: 'DELETE',
        headers,
      })

      setMensagem('Cadastro excluído com sucesso!')
      await carregarItens()
    } catch (error) {
      setErro(error.message || 'Não foi possível excluir o cadastro.')
    }
  }

  const itensFiltrados = itens.filter((item) => {
    return filtro === 'todos' || item.tipo === filtro
  })

  function nomeTipo(valor) {
    const tipos = {
      renda: 'Fonte de renda',
      conta: 'Conta',
      cartao_credito: 'Cartão de crédito',
    }

    return tipos[valor] || valor
  }

  function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <main className="fontes-page">
      <header className="fontes-header">
        <div>
          <span className="fontes-eyebrow">ORGANIZAÇÃO FINANCEIRA</span>
          <h1>Fontes e destinos</h1>
          <p>Gerencie suas rendas, contas e cartões de crédito.</p>
        </div>
      </header>

      <section className="fontes-resumo">
        <article className="fontes-resumo-card">
          <span>Total de cadastros</span>
          <strong>{itens.length}</strong>
        </article>

        <article className="fontes-resumo-card">
          <span>Fontes de renda</span>
          <strong>{itens.filter((item) => item.tipo === 'renda').length}</strong>
        </article>

        <article className="fontes-resumo-card">
          <span>Contas e cartões</span>
          <strong>
            {itens.filter((item) => item.tipo !== 'renda').length}
          </strong>
        </article>
      </section>

      <section className="fontes-conteudo">
        <div className="fontes-form-card">
          <h2>{itemEditando ? 'Editar cadastro' : 'Novo cadastro'}</h2>
          <p>Informe os dados da fonte ou destino financeiro.</p>

          <form onSubmit={salvarItem}>
            <div className="fontes-campo">
              <label htmlFor="nome-fonte">Nome</label>
              <input
                id="nome-fonte"
                type="text"
                placeholder="Ex.: Salário, Banco ou Cartão"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="fontes-campo">
              <label htmlFor="tipo-fonte">Tipo</label>
              <select
                id="tipo-fonte"
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
              >
                <option value="renda">Fonte de renda</option>
                <option value="conta">Conta</option>
                <option value="cartao_credito">Cartão de crédito</option>
              </select>
            </div>

            {tipo === 'cartao_credito' && (
              <>
                <div className="fontes-campo">
                  <label htmlFor="fechamento">Dia de fechamento</label>
                  <input
                    id="fechamento"
                    type="number"
                    min="1"
                    max="31"
                    value={diaFechamento}
                    onChange={(event) => setDiaFechamento(event.target.value)}
                    required
                  />
                </div>

                <div className="fontes-campo">
                  <label htmlFor="vencimento">Dia de vencimento</label>
                  <input
                    id="vencimento"
                    type="number"
                    min="1"
                    max="31"
                    value={diaVencimento}
                    onChange={(event) => setDiaVencimento(event.target.value)}
                    required
                  />
                </div>

                <div className="fontes-campo">
                  <label htmlFor="limite">Limite do cartão (R$)</label>
                  <input
                    id="limite"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Ex.: 2500.00"
                    value={limite}
                    onChange={(event) => setLimite(event.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {erro && <div className="fontes-erro">{erro}</div>}
            {mensagem && <div className="fontes-sucesso">{mensagem}</div>}

            <div className="fontes-acoes-form">
              <button
                type="submit"
                className="fontes-botao-principal"
                disabled={salvando}
              >
                {salvando
                  ? 'Salvando...'
                  : itemEditando
                    ? 'Salvar alterações'
                    : 'Cadastrar'}
              </button>

              {itemEditando && (
                <button
                  type="button"
                  className="fontes-botao-secundario"
                  onClick={limparFormulario}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="fontes-lista-card">
          <div className="fontes-lista-header">
            <div>
              <h2>Meus cadastros</h2>
              <p>Consulte e gerencie suas fontes e destinos.</p>
            </div>

            <select
              aria-label="Filtrar cadastros"
              value={filtro}
              onChange={(event) => setFiltro(event.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="renda">Rendas</option>
              <option value="conta">Contas</option>
              <option value="cartao_credito">Cartões</option>
            </select>
          </div>

          {carregando ? (
            <p className="fontes-vazio">Carregando cadastros...</p>
          ) : itensFiltrados.length === 0 ? (
            <div className="fontes-vazio">
              <span>📁</span>
              <strong>Nenhum cadastro encontrado</strong>
              <p>Adicione uma fonte ou destino para começar.</p>
            </div>
          ) : (
            <div className="fontes-lista">
              {itensFiltrados.map((item) => (
                <article className="fonte-item" key={item.id}>
                  <div className="fonte-item-info">
                    <span className={`fonte-indicador ${item.tipo}`}>
                      {item.tipo === 'renda'
                        ? '↗'
                        : item.tipo === 'conta'
                          ? '▤'
                          : '▣'}
                    </span>

                    <div>
                      <strong>{item.nome}</strong>
                      <span>{nomeTipo(item.tipo)}</span>

                      {item.tipo === 'cartao_credito' && (
                        <small>
                          Fecha dia {item.dia_fechamento} · Vence dia{' '}
                          {item.dia_vencimento} · Limite{' '}
                          {formatarMoeda(item.limite)}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="fonte-item-acoes">
                    <button
                      type="button"
                      onClick={() => editarItem(item)}
                      aria-label={`Editar ${item.nome}`}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="fonte-excluir"
                      onClick={() => excluirItem(item)}
                      aria-label={`Excluir ${item.nome}`}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default FontesDestinos
