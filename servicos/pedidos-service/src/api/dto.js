/** Formato público do pedido (contrato em docs/API.md). */
export function paraPedidoResponse(pedido) {
  return {
    id: pedido.id,
    compradorId: pedido.compradorId,
    compradorNome: pedido.compradorNome,
    vendedorId: pedido.vendedorId,
    vendedorNome: pedido.vendedorNome,
    itens: pedido.itens.map((i) => ({
      produtoId: i.produtoId,
      nome: i.nome,
      precoUnitario: i.precoUnitario,
      quantidade: i.quantidade,
    })),
    total: pedido.total,
    tipoEntrega: pedido.tipoEntrega,
    blocoEncontro: pedido.blocoEncontro,
    status: pedido.status,
    criadoEm: pedido.criadoEm.toISOString(),
  };
}
