import { formatarMoeda } from '../../utils/formatadores.js'

export default function ProdutoCard({ produto, ehMeu, aoComprar }) {
  return (
    <div className="card produto">
      {produto.imagemUrl && <img src={produto.imagemUrl} alt={produto.nome} />}
      <h3>{produto.nome}</h3>
      <p className="desc">{produto.descricao}</p>
      <p className="preco">{formatarMoeda(produto.preco)}</p>
      <p className="meta">📍 {produto.bloco} · vendido por {produto.vendedorNome}</p>
      {ehMeu ? <span className="tag">Seu produto</span> : <button onClick={() => aoComprar(produto)}>Comprar</button>}
    </div>
  )
}
