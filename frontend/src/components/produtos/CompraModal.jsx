import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import { pedidosService } from '../../services/pedidosService.js'
import { formatarMoeda } from '../../utils/formatadores.js'

export default function CompraModal({ produto, aoFechar, notificar }) {
  const [quantidade, setQuantidade] = useState(1)
  const [tipoEntrega, setTipoEntrega] = useState('RETIRADA')
  const [blocoEncontro, setBlocoEncontro] = useState(produto.bloco)
  const [metodoPagamento, setMetodoPagamento] = useState('PIX')

  async function confirmar() {
    try {
      const pedido = await pedidosService.criar({
        itens: [{ produtoId: produto.id, quantidade: Number(quantidade) }],
        tipoEntrega,
        blocoEncontro: tipoEntrega === 'RETIRADA' ? produto.bloco : blocoEncontro,
        metodoPagamento,
      })
      notificar(`Pedido #${pedido.id} criado! Total ${formatarMoeda(pedido.total)}`)
      aoFechar()
    } catch (e) {
      notificar(e.message, 'erro')
    }
  }

  return (
    <Modal aoFechar={aoFechar}>
      <h3>Comprar {produto.nome}</h3>
      <label>Quantidade
        <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
      </label>
      <label>Entrega
        <select value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
          <option value="RETIRADA">Retirar no {produto.bloco}</option>
          <option value="ENTREGA">Combinar entrega em outro bloco</option>
        </select>
      </label>
      {tipoEntrega === 'ENTREGA' && (
        <label>Bloco do encontro
          <input value={blocoEncontro} onChange={(e) => setBlocoEncontro(e.target.value)} />
        </label>
      )}
      <label>Pagamento
        <select value={metodoPagamento} onChange={(e) => setMetodoPagamento(e.target.value)}>
          <option>PIX</option>
          <option>DINHEIRO</option>
          <option>CARTAO</option>
        </select>
      </label>
      <p className="preco">Estimativa: {formatarMoeda(produto.preco * quantidade)}</p>
      <div className="acoes">
        <button onClick={confirmar}>Confirmar pedido</button>
        <button className="link" onClick={aoFechar}>Cancelar</button>
      </div>
    </Modal>
  )
}
