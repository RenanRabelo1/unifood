import { criarCliente } from './http.js'

const http = criarCliente('pedidos')

export const pedidosService = {
  criar: (pedido) => http('/pedidos', { method: 'POST', body: pedido }),
  meus: () => http('/pedidos/meus'),
  recebidos: () => http('/pedidos/recebidos'),
  alterarStatus: (id, status) => http(`/pedidos/${id}/status`, { method: 'PATCH', body: { status } }),
}
