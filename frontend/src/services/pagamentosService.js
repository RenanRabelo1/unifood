import { criarCliente } from './http.js'

const http = criarCliente('pagamentos')

export const pagamentosService = {
  doPedido: (pedidoId) => http(`/pagamentos/pedido/${pedidoId}`),
  confirmar: (id) => http(`/pagamentos/${id}/confirmar`, { method: 'PATCH' }),
  cancelar: (id) => http(`/pagamentos/${id}/cancelar`, { method: 'PATCH' }),
}
