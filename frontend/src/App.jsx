import { useEffect, useState } from 'react'
import { api, getToken } from './api.js'

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [aba, setAba] = useState('vitrine')
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    if (getToken()) api.validar().then(setUsuario).catch(() => localStorage.removeItem('unifood_token'))
  }, [])

  const notificar = (msg, tipo = 'ok') => {
    setAviso({ msg, tipo })
    setTimeout(() => setAviso(null), 3500)
  }
  const sair = () => { localStorage.removeItem('unifood_token'); setUsuario(null) }

  if (!usuario) return <Auth onLogin={setUsuario} notificar={notificar} aviso={aviso} />

  const abas = { vitrine: 'Vitrine', meus: 'Meus produtos', compras: 'Minhas compras', vendas: 'Pedidos recebidos' }
  return (
    <div className="app">
      <header>
        <h1>🍫 UniFood</h1>
        <nav>
          {Object.entries(abas).map(([k, v]) => (
            <button key={k} className={aba === k ? 'ativa' : ''} onClick={() => setAba(k)}>{v}</button>
          ))}
        </nav>
        <div className="user">Olá, {usuario.nome.split(' ')[0]} <button className="link" onClick={sair}>Sair</button></div>
      </header>
      {aviso && <div className={`aviso ${aviso.tipo}`}>{aviso.msg}</div>}
      <main>
        {aba === 'vitrine' && <Vitrine usuario={usuario} notificar={notificar} />}
        {aba === 'meus' && <MeusProdutos notificar={notificar} />}
        {aba === 'compras' && <Pedidos tipo="compras" notificar={notificar} />}
        {aba === 'vendas' && <Pedidos tipo="vendas" notificar={notificar} />}
      </main>
    </div>
  )
}

function Auth({ onLogin, notificar, aviso }) {
  const [modo, setModo] = useState('login')
  const [f, setF] = useState({ nome: '', email: '', matricula: '', senha: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function enviar(e) {
    e.preventDefault()
    try {
      if (modo === 'cadastro') {
        await api.cadastrar(f)
        notificar('Conta criada! Entrando…')
      }
      const { token, usuario } = await api.login(f.email, f.senha)
      localStorage.setItem('unifood_token', token)
      onLogin(usuario)
    } catch (err) { notificar(err.message, 'erro') }
  }

  return (
    <div className="auth">
      <h1>🍫 UniFood</h1>
      <p>Compre e venda lanches entre alunos do campus.</p>
      {aviso && <div className={`aviso ${aviso.tipo}`}>{aviso.msg}</div>}
      <form onSubmit={enviar} className="card">
        {modo === 'cadastro' && <input placeholder="Nome" value={f.nome} onChange={set('nome')} required />}
        <input placeholder="E-mail" type="email" value={f.email} onChange={set('email')} required />
        {modo === 'cadastro' && <input placeholder="Matrícula (opcional)" value={f.matricula} onChange={set('matricula')} />}
        <input placeholder="Senha" type="password" value={f.senha} onChange={set('senha')} required minLength={6} />
        <button type="submit">{modo === 'login' ? 'Entrar' : 'Cadastrar'}</button>
        <button type="button" className="link" onClick={() => setModo(modo === 'login' ? 'cadastro' : 'login')}>
          {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  )
}

function Vitrine({ usuario, notificar }) {
  const [produtos, setProdutos] = useState([])
  const [bloco, setBloco] = useState('')
  const [comprando, setComprando] = useState(null)

  const carregar = () => api.produtos(bloco).then(setProdutos).catch((e) => notificar(e.message, 'erro'))
  useEffect(() => { carregar() }, [])

  return (
    <>
      <div className="filtro">
        <input placeholder="Filtrar por bloco (ex.: Bloco A)" value={bloco} onChange={(e) => setBloco(e.target.value)} />
        <button onClick={carregar}>Buscar</button>
      </div>
      {produtos.length === 0 && <p className="vazio">Nenhum produto disponível.</p>}
      <div className="grid">
        {produtos.map((p) => (
          <div key={p.id} className="card produto">
            {p.imagemUrl && <img src={p.imagemUrl} alt={p.nome} />}
            <h3>{p.nome}</h3>
            <p className="desc">{p.descricao}</p>
            <p className="preco">{brl(p.preco)}</p>
            <p className="meta">📍 {p.bloco} · vendido por {p.vendedorNome}</p>
            {p.vendedorId === usuario.id
              ? <span className="tag">Seu produto</span>
              : <button onClick={() => setComprando(p)}>Comprar</button>}
          </div>
        ))}
      </div>
      {comprando && <Compra produto={comprando} fechar={() => setComprando(null)} notificar={notificar} />}
    </>
  )
}

function Compra({ produto, fechar, notificar }) {
  const [quantidade, setQuantidade] = useState(1)
  const [tipoEntrega, setTipo] = useState('RETIRADA')
  const [blocoEncontro, setBloco] = useState(produto.bloco)
  const [metodoPagamento, setMetodo] = useState('PIX')

  async function confirmar() {
    try {
      const pedido = await api.criarPedido({
        itens: [{ produtoId: produto.id, quantidade: Number(quantidade) }],
        tipoEntrega,
        blocoEncontro: tipoEntrega === 'RETIRADA' ? produto.bloco : blocoEncontro,
        metodoPagamento,
      })
      notificar(`Pedido #${pedido.id} criado! Total ${brl(pedido.total)}`)
      fechar()
    } catch (e) { notificar(e.message, 'erro') }
  }

  return (
    <div className="modal" onClick={fechar}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h3>Comprar {produto.nome}</h3>
        <label>Quantidade <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} /></label>
        <label>Entrega
          <select value={tipoEntrega} onChange={(e) => setTipo(e.target.value)}>
            <option value="RETIRADA">Retirar no {produto.bloco}</option>
            <option value="ENTREGA">Combinar entrega em outro bloco</option>
          </select>
        </label>
        {tipoEntrega === 'ENTREGA' && (
          <label>Bloco do encontro <input value={blocoEncontro} onChange={(e) => setBloco(e.target.value)} /></label>
        )}
        <label>Pagamento
          <select value={metodoPagamento} onChange={(e) => setMetodo(e.target.value)}>
            <option>PIX</option><option>DINHEIRO</option><option>CARTAO</option>
          </select>
        </label>
        <p className="preco">Estimativa: {brl(produto.preco * quantidade)}</p>
        <div className="acoes">
          <button onClick={confirmar}>Confirmar pedido</button>
          <button className="link" onClick={fechar}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

const vazio = { nome: '', descricao: '', preco: '', bloco: '', imagemUrl: '', disponivel: true }

function MeusProdutos({ notificar }) {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(vazio)
  const [editando, setEditando] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const carregar = () => api.meusProdutos().then(setLista).catch((e) => notificar(e.message, 'erro'))
  useEffect(() => { carregar() }, [])

  async function salvar(e) {
    e.preventDefault()
    const body = { ...form, preco: Number(form.preco) }
    try {
      if (editando) await api.editarProduto(editando, body)
      else await api.criarProduto(body)
      notificar(editando ? 'Produto atualizado' : 'Produto cadastrado')
      setForm(vazio); setEditando(null); carregar()
    } catch (err) { notificar(err.message, 'erro') }
  }

  async function remover(id) {
    if (!confirm('Remover este produto?')) return
    try { await api.removerProduto(id); notificar('Produto removido'); carregar() } catch (e) { notificar(e.message, 'erro') }
  }

  return (
    <div className="duas-colunas">
      <form className="card" onSubmit={salvar}>
        <h3>{editando ? 'Editar produto' : 'Novo produto'}</h3>
        <input placeholder="Nome" value={form.nome} onChange={set('nome')} required />
        <textarea placeholder="Descrição" value={form.descricao || ''} onChange={set('descricao')} />
        <input placeholder="Preço" type="number" step="0.01" min="0.01" value={form.preco} onChange={set('preco')} required />
        <input placeholder="Bloco de retirada (ex.: Bloco A)" value={form.bloco} onChange={set('bloco')} required />
        <input placeholder="URL da imagem (opcional)" value={form.imagemUrl || ''} onChange={set('imagemUrl')} />
        <label className="check"><input type="checkbox" checked={form.disponivel} onChange={set('disponivel')} /> Disponível</label>
        <button type="submit">{editando ? 'Salvar' : 'Cadastrar'}</button>
        {editando && <button type="button" className="link" onClick={() => { setEditando(null); setForm(vazio) }}>Cancelar edição</button>}
      </form>
      <div>
        {lista.length === 0 && <p className="vazio">Você ainda não cadastrou produtos.</p>}
        {lista.map((p) => (
          <div key={p.id} className="card linha">
            <div>
              <strong>{p.nome}</strong> — {brl(p.preco)} · {p.bloco} {!p.disponivel && <span className="tag">indisponível</span>}
            </div>
            <div className="acoes">
              <button className="link" onClick={() => { setEditando(p.id); setForm({ ...p }) }}>Editar</button>
              <button className="link perigo" onClick={() => remover(p.id)}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const proximoStatus = { PENDENTE: 'CONFIRMADO', CONFIRMADO: 'PRONTO', PRONTO: 'ENTREGUE' }

function Pedidos({ tipo, notificar }) {
  const [pedidos, setPedidos] = useState([])
  const [pagamentos, setPagamentos] = useState({})
  const vendedor = tipo === 'vendas'

  async function carregar() {
    try {
      const lista = await (vendedor ? api.pedidosRecebidos() : api.meusPedidos())
      setPedidos(lista)
      const pags = {}
      await Promise.all(lista.map((p) => api.pagamentoDoPedido(p.id).then((pg) => { pags[p.id] = pg }).catch(() => {})))
      setPagamentos(pags)
    } catch (e) { notificar(e.message, 'erro') }
  }
  useEffect(() => { carregar() }, [tipo])

  const agir = (fn, msg) => async () => {
    try { await fn(); notificar(msg); carregar() } catch (e) { notificar(e.message, 'erro') }
  }

  if (pedidos.length === 0) return <p className="vazio">Nenhum pedido ainda.</p>
  return pedidos.map((p) => {
    const pg = pagamentos[p.id]
    const ativo = !['ENTREGUE', 'CANCELADO'].includes(p.status)
    return (
      <div key={p.id} className="card pedido">
        <div className="topo">
          <strong>Pedido #{p.id}</strong>
          <span className={`status s-${p.status}`}>{p.status}</span>
        </div>
        <ul>{(p.itens || []).map((i, k) => <li key={k}>{i.quantidade}× {i.nome} — {brl(i.precoUnitario)}</li>)}</ul>
        <p>
          Total <strong>{brl(p.total)}</strong> · {p.tipoEntrega === 'RETIRADA' ? 'Retirada' : 'Entrega'} no {p.blocoEncontro} ·{' '}
          {vendedor ? `comprador: ${p.compradorNome || p.compradorId}` : `vendedor: ${p.vendedorNome || p.vendedorId}`}
        </p>
        {pg && <p>💳 Pagamento {pg.metodo}: <span className={`status s-${pg.status}`}>{pg.status}</span></p>}
        <div className="acoes">
          {vendedor && ativo && proximoStatus[p.status] && (
            <button onClick={agir(() => api.alterarStatus(p.id, proximoStatus[p.status]), 'Status atualizado')}>
              Marcar como {proximoStatus[p.status]}
            </button>
          )}
          {vendedor && pg?.status === 'PENDENTE' && (
            <button onClick={agir(() => api.confirmarPagamento(pg.id), 'Pagamento confirmado')}>Confirmar pagamento</button>
          )}
          {ativo && (
            <button className="link perigo" onClick={agir(async () => {
              await api.alterarStatus(p.id, 'CANCELADO')
              if (pg && pg.status === 'PENDENTE') await api.cancelarPagamento(pg.id)
            }, 'Pedido cancelado')}>Cancelar pedido</button>
          )}
        </div>
      </div>
    )
  })
}
