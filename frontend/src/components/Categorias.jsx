
import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/useAuth'
import './Categorias.css'

function Categorias() {
  const { token } = useAuth()

  const [categorias, setCategorias] = useState([])
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('saida')
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const headers = {
    Authorization: `Bearer ${token}`,
  }

 const carregarCategorias = useCallback(async () => {
  try {
    const dados = await apiRequest('/api/categorias', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    setCategorias(Array.isArray(dados) ? dados : dados.categorias || [])
    setErro('')
  } catch (error) {
    setErro(error.message || 'Não foi possível carregar as categorias.')
  } finally {
    setCarregando(false)
  }
}, [token])

 useEffect(() => {
  let ativo = true

  async function carregarInicialmente() {
    try {
      const dados = await apiRequest('/api/categorias', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (ativo) {
        setCategorias(Array.isArray(dados) ? dados : dados.categorias || [])
        setErro('')
      }
    } catch (error) {
      if (ativo) {
        setErro(error.message || 'Não foi possível carregar as categorias.')
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
    setTipo('saida')
    setCategoriaEditando(null)
    setErro('')
    setMensagem('')
  }

  async function salvarCategoria(event) {
    event.preventDefault()

    setErro('')
    setMensagem('')

    const nomeFormatado = nome.trim()

    if (!nomeFormatado) {
      setErro('Informe o nome da categoria.')
      return
    }

    setSalvando(true)

    try {
      const editando = categoriaEditando !== null

      await apiRequest(
        editando
          ? `/api/categorias/${categoriaEditando.id}`
          : '/api/categorias',
        {
          method: editando ? 'PUT' : 'POST',
          headers,
          body: JSON.stringify({
            nome: nomeFormatado,
            tipo,
          }),
        },
      )

      setMensagem(
        editando
          ? 'Categoria atualizada com sucesso!'
          : 'Categoria cadastrada com sucesso!',
      )

      limparFormulario()
      await carregarCategorias()
    } catch (error) {
      setErro(
        error.message || 'Não foi possível salvar a categoria.',
      )
    } finally {
      setSalvando(false)
    }
  }

  function editarCategoria(categoria) {
    setCategoriaEditando(categoria)
    setNome(categoria.nome)
    setTipo(categoria.tipo)
    setErro('')
    setMensagem('')
  }

  async function excluirCategoria(categoria) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a categoria "${categoria.nome}"?`,
    )

    if (!confirmar) return

    setErro('')
    setMensagem('')

    try {
      await apiRequest(`/api/categorias/${categoria.id}`, {
        method: 'DELETE',
        headers,
      })

      setMensagem('Categoria excluída com sucesso!')
      await carregarCategorias()
    } catch (error) {
      setErro(
        error.message || 'Não foi possível excluir a categoria.',
      )
    }
  }

  const categoriasFiltradas = categorias.filter((categoria) => {
    return filtro === 'todos' || categoria.tipo === filtro
  })

  return (
    <main className="categorias-page">
      <header className="categorias-header">
        <div>
          <span className="categorias-eyebrow">ORGANIZAÇÃO FINANCEIRA</span>
          <h1>Categorias</h1>
          <p>Organize suas receitas e despesas de forma simples.</p>
        </div>
      </header>

      <section className="categorias-resumo">
        <article className="categoria-resumo-card">
          <span>Total de categorias</span>
          <strong>{categorias.length}</strong>
        </article>

        <article className="categoria-resumo-card">
          <span>Categorias de entrada</span>
          <strong>
            {categorias.filter((item) => item.tipo === 'entrada').length}
          </strong>
        </article>

        <article className="categoria-resumo-card">
          <span>Categorias de saída</span>
          <strong>
            {categorias.filter((item) => item.tipo === 'saida').length}
          </strong>
        </article>
      </section>

      <section className="categorias-conteudo">
        <div className="categorias-form-card">
          <h2>
            {categoriaEditando ? 'Editar categoria' : 'Nova categoria'}
          </h2>

          <p>Preencha os dados para organizar suas movimentações.</p>

          <form onSubmit={salvarCategoria}>
            <div className="categoria-campo">
              <label htmlFor="nome-categoria">Nome da categoria</label>
              <input
                id="nome-categoria"
                type="text"
                placeholder="Ex.: Alimentação"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="categoria-campo">
              <label htmlFor="tipo-categoria">Tipo</label>
              <select
                id="tipo-categoria"
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>

            {erro && <div className="categoria-erro">{erro}</div>}
            {mensagem && (
              <div className="categoria-sucesso">{mensagem}</div>
            )}

            <div className="categoria-acoes-form">
              <button
                type="submit"
                className="categoria-botao-principal"
                disabled={salvando}
              >
                {salvando
                  ? 'Salvando...'
                  : categoriaEditando
                    ? 'Salvar alterações'
                    : 'Cadastrar categoria'}
              </button>

              {categoriaEditando && (
                <button
                  type="button"
                  className="categoria-botao-secundario"
                  onClick={limparFormulario}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="categorias-lista-card">
          <div className="categorias-lista-header">
            <div>
              <h2>Minhas categorias</h2>
              <p>Gerencie suas categorias cadastradas.</p>
            </div>

            <select
              aria-label="Filtrar categorias"
              value={filtro}
              onChange={(event) => setFiltro(event.target.value)}
            >
              <option value="todos">Todas</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>

          {carregando ? (
            <p className="categorias-vazio">Carregando categorias...</p>
          ) : categoriasFiltradas.length === 0 ? (
            <div className="categorias-vazio">
              <span>📂</span>
              <strong>Nenhuma categoria encontrada</strong>
              <p>Cadastre uma categoria para começar.</p>
            </div>
          ) : (
            <div className="categorias-lista">
              {categoriasFiltradas.map((categoria) => (
                <article className="categoria-item" key={categoria.id}>
                  <div className="categoria-item-info">
                    <span
                      className={`categoria-indicador ${categoria.tipo}`}
                    >
                      {categoria.tipo === 'entrada' ? '↗' : '↘'}
                    </span>

                    <div>
                      <strong>{categoria.nome}</strong>
                      <span>
                        {categoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </div>
                  </div>

                  <div className="categoria-item-acoes">
                    <button
                      type="button"
                      onClick={() => editarCategoria(categoria)}
                      aria-label={`Editar ${categoria.nome}`}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="categoria-excluir"
                      onClick={() => excluirCategoria(categoria)}
                      aria-label={`Excluir ${categoria.nome}`}
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

export default Categorias
