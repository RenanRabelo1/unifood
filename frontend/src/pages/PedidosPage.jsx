import { useEffect, useState } from 'react'
import PedidoCard from '../components/pedidos/PedidoCard.jsx'
import { pedidosService } from '../services/pedidosService.js'
import { pagamentosService } from '../services/pagamentosService.js'

/** visao = 'compras' (sou comprador) ou 'vendas' (sou vendedor). */
export default function PedidosPage({ visao, notificar }) {
  const [pedidos, setPedidos] = useState([])
  const [pagamentos, setPagamentos] = useState({})
  const visaoVendedor = visao === 'vendas'

  async function carregar() {
    try {
      const lista = await (visaoVendedor ? pedidosService.recebidos() : pedidosService.meus())
      setPedidos(lista)
      const porPedido = {}
      await Promise.all(lista.map((p) =>
        pagamentosService.doPedido(p.id).then((pg) => { porPedido[p.id] = pg }).catch(() => {})))
      setPagamentos(porPedido)
    } catch (e) {
      notificar(e.message, 'erro')
    }
  }
  useEffect(() => { carregar() }, [visao])

  const executar = (acao, mensagem) => async () => {
    try {
      await acao()
      notificar(mensagem)
      carregar()
    } catch (e) {
      notificar(e.message, 'erro')
    }
  }

  if (pedidos.length === 0) return <p className="vazio">Nenhum pedido ainda.</p>

  return pedidos.map((pedido) => (
    <PedidoCard
      key={pedido.id}
      pedido={pedido}
      pagamento={pagamentos[pedido.id]}
      visaoVendedor={visaoVendedor}
      aoAvancar={(p, status) => executar(() => pedidosService.alterarStatus(p.id, status), 'Status atualizado')()}
      aoConfirmarPagamento={(pg) => executar(() => pagamentosService.confirmar(pg.id), 'Pagamento confirmado')()}
      aoCancelar={(p, pg) => executar(async () => {
        await pedidosService.alterarStatus(p.id, 'CANCELADO')
        if (pg?.status === 'PENDENTE') await pagamentosService.cancelar(pg.id)
      }, 'Pedido cancelado')()}
    />
  ))
}
