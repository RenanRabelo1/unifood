import { useEffect, useState } from 'react'
import ProdutoCard from '../components/produtos/ProdutoCard.jsx'
import CompraModal from '../components/produtos/CompraModal.jsx'
import { produtosService } from '../services/produtosService.js'

export default function VitrinePage({ usuario, notificar }) {
  const [produtos, setProdutos] = useState([])
  const [bloco, setBloco] = useState('')
  const [comprando, setComprando] = useState(null)

  const carregar = () => produtosService.listar(bloco).then(setProdutos).catch((e) => notificar(e.message, 'erro'))
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
          <ProdutoCard key={p.id} produto={p} ehMeu={p.vendedorId === usuario.id} aoComprar={setComprando} />
        ))}
      </div>
      {comprando && <CompraModal produto={comprando} aoFechar={() => setComprando(null)} notificar={notificar} />}
    </>
  )
}
