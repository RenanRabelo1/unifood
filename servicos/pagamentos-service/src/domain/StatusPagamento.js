/** Ciclo de vida do pagamento simulado: nasce PENDENTE e termina CONFIRMADO ou CANCELADO (ambos finais). */
export const StatusPagamento = Object.freeze({
  PENDENTE: 'PENDENTE',
  CONFIRMADO: 'CONFIRMADO',
  CANCELADO: 'CANCELADO',
});

export const MetodoPagamento = Object.freeze({ PIX: 'PIX', DINHEIRO: 'DINHEIRO', CARTAO: 'CARTAO' });
