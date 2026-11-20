import { useEffect, useState } from 'react'
import ProdutoForm, { PRODUTO_VAZIO } from '../components/produtos/ProdutoForm.jsx'
import { produtosService } from '../services/produtosService.js'
import { formatarMoeda } from '../utils/formatadores.js'

export default function MeusProdutosPage({ notificar }) {
  const [produtos, setProdutos] = useState([])
  const [emEdicao, setEmEdicao] = useState(null)
  const [versaoForm, setVersaoForm] = useState(0) // muda a key para limpar o formulário

  const carregar = () => produtosService.meus().then(setProdutos).catch((e) => notificar(e.message, 'erro'))
  useEffect(() => { carregar() }, [])

  async function salvar(dados) {
    try {
      if (emEdicao) await produtosService.editar(emEdicao.id, dados)
      else await produtosService.criar(dados)
      notificar(emEdicao ? 'Produto atualizado' : 'Produto cadastrado')
      setEmEdicao(null)
      setVersaoForm((v) => v + 1)
      carregar()
    } catch (e) {
      notificar(e.message, 'erro')
    }
  }

  async function remover(id) {
    if (!confirm('Remover este produto?')) return
    try {
      await produtosService.remover(id)
      notificar('Produto removido')
      carregar()
    } catch (e) {
      notificar(e.message, 'erro')
    }
  }

  return (
    <div className="duas-colunas">
      <ProdutoForm
        key={emEdicao ? emEdicao.id : `novo-${versaoForm}`}
        inicial={emEdicao || PRODUTO_VAZIO}
        editando={Boolean(emEdicao)}
        aoSalvar={salvar}
        aoCancelar={() => setEmEdicao(null)}
      />
      <div>
        {produtos.length === 0 && <p className="vazio">Você ainda não cadastrou produtos.</p>}
        {produtos.map((p) => (
          <div key={p.id} className="card linha">
            <div>
              <strong>{p.nome}</strong> — {formatarMoeda(p.preco)} · {p.bloco}{' '}
              {!p.disponivel && <span className="tag">indisponível</span>}
            </div>
            <div className="acoes">
              <button className="link" onClick={() => setEmEdicao(p)}>Editar</button>
              <button className="link perigo" onClick={() => remover(p.id)}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
