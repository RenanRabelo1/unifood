/** Formato público do pagamento (contrato em docs/API.md). */
export function paraPagamentoResponse(pagamento) {
  return {
    id: pagamento.id,
    pedidoId: pagamento.pedidoId,
    compradorId: pagamento.compradorId,
    vendedorId: pagamento.vendedorId,
    valor: pagamento.valor,
    metodo: pagamento.metodo,
    status: pagamento.status,
    criadoEm: pagamento.criadoEm.toISOString(),
    confirmadoEm: pagamento.confirmadoEm ? pagamento.confirmadoEm.toISOString() : null,
  };
}
