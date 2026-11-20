import StatusBadge from '../ui/StatusBadge.jsx'
import { formatarMoeda } from '../../utils/formatadores.js'

const PROXIMO_STATUS = { PENDENTE: 'CONFIRMADO', CONFIRMADO: 'PRONTO', PRONTO: 'ENTREGUE' }
const FINALIZADOS = ['ENTREGUE', 'CANCELADO']

export default function PedidoCard({ pedido, pagamento, visaoVendedor, aoAvancar, aoConfirmarPagamento, aoCancelar }) {
  const ativo = !FINALIZADOS.includes(pedido.status)
  const proximo = PROXIMO_STATUS[pedido.status]
  const outraParte = visaoVendedor
    ? `comprador: ${pedido.compradorNome || pedido.compradorId}`
    : `vendedor: ${pedido.vendedorNome || pedido.vendedorId}`

  return (
    <div className="card pedido">
      <div className="topo">
        <strong>Pedido #{pedido.id}</strong>
        <StatusBadge status={pedido.status} />
      </div>
      <ul>
        {(pedido.itens || []).map((item, i) => (
          <li key={i}>{item.quantidade}× {item.nome} — {formatarMoeda(item.precoUnitario)}</li>
        ))}
      </ul>
      <p>
        Total <strong>{formatarMoeda(pedido.total)}</strong> ·{' '}
        {pedido.tipoEntrega === 'RETIRADA' ? 'Retirada' : 'Entrega'} no {pedido.blocoEncontro} · {outraParte}
      </p>
      {pagamento && <p>💳 Pagamento {pagamento.metodo}: <StatusBadge status={pagamento.status} /></p>}
      <div className="acoes">
        {visaoVendedor && ativo && proximo && (
          <button onClick={() => aoAvancar(pedido, proximo)}>Marcar como {proximo}</button>
        )}
        {visaoVendedor && pagamento?.status === 'PENDENTE' && (
          <button onClick={() => aoConfirmarPagamento(pagamento)}>Confirmar pagamento</button>
        )}
        {ativo && <button className="link perigo" onClick={() => aoCancelar(pedido, pagamento)}>Cancelar pedido</button>}
      </div>
    </div>
  )
}
