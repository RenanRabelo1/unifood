/** Item de um pedido: guarda uma "foto" do nome e do preço no momento da compra. */
export class ItemPedido {
  constructor({ produtoId, nome, precoUnitario, quantidade }) {
    this.produtoId = String(produtoId);
    this.nome = nome;
    this.precoUnitario = Number(precoUnitario);
    this.quantidade = quantidade;
    Object.freeze(this);
  }

  static de(produto, quantidade) {
    return new ItemPedido({ produtoId: produto.id, nome: produto.nome, precoUnitario: produto.preco, quantidade });
  }

  /** Subtotal em centavos: evita erros de arredondamento de ponto flutuante (0.1 + 0.2). */
  get subtotalEmCentavos() {
    return Math.round(this.precoUnitario * 100) * this.quantidade;
  }
}
