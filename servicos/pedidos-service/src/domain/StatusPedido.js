/** Ciclo de vida do pedido: PENDENTE -> CONFIRMADO -> PRONTO -> ENTREGUE (e CANCELADO enquanto não entregue). */
export const StatusPedido = Object.freeze({
  PENDENTE: 'PENDENTE',
  CONFIRMADO: 'CONFIRMADO',
  PRONTO: 'PRONTO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO',
});

export const PROXIMO_STATUS = Object.freeze({
  [StatusPedido.PENDENTE]: StatusPedido.CONFIRMADO,
  [StatusPedido.CONFIRMADO]: StatusPedido.PRONTO,
  [StatusPedido.PRONTO]: StatusPedido.ENTREGUE,
});

export const STATUS_CANCELAVEIS = Object.freeze([StatusPedido.PENDENTE, StatusPedido.CONFIRMADO, StatusPedido.PRONTO]);

export const TipoEntrega = Object.freeze({ ENTREGA: 'ENTREGA', RETIRADA: 'RETIRADA' });
