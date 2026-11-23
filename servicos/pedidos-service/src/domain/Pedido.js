import { AcessoNegadoError, PedidoInvalidoError, TransicaoInvalidaError } from '../erros.js';
import { ItemPedido } from './ItemPedido.js';
import { PROXIMO_STATUS, STATUS_CANCELAVEIS, StatusPedido, TipoEntrega } from './StatusPedido.js';

/**
 * Entidade de domínio. Não conhece Express, MySQL nem HTTP.
 * Imutável: alterar o status devolve um novo Pedido.
 * GRASP Information Expert: o Pedido sabe calcular o total, quem pode vê-lo e como o status evolui.
 */
export class Pedido {
  constructor({
    id = null, compradorId, compradorNome, vendedorId, vendedorNome,
    itens, total, tipoEntrega, blocoEncontro, status, criadoEm,
  }) {
    this.id = id;
    this.compradorId = compradorId;
    this.compradorNome = compradorNome;
    this.vendedorId = vendedorId;
    this.vendedorNome = vendedorNome;
    this.itens = Object.freeze([...itens]);
    this.total = total;
    this.tipoEntrega = tipoEntrega;
    this.blocoEncontro = blocoEncontro;
    this.status = status;
    this.criadoEm = criadoEm;
    Object.freeze(this);
  }

  /**
   * GRASP Creator: aplica todas as regras de criação e calcula o total.
   * @param comprador {id, nome} — usuário autenticado
   * @param itens     [{ produto, quantidade }] — produto vem do serviço de Produtos (preço nunca vem do cliente)
   */
  static criar({ comprador, itens, tipoEntrega, blocoEncontro }) {
    if (itens.length === 0) throw new PedidoInvalidoError('O pedido precisa ter pelo menos um item');

    for (const { produto } of itens) {
      if (!produto.disponivel) throw new PedidoInvalidoError(`Produto "${produto.nome}" está indisponível`);
    }

    const [{ produto: primeiro }] = itens;
    if (itens.some(({ produto }) => produto.vendedorId !== primeiro.vendedorId)) {
      throw new PedidoInvalidoError('Todos os itens do pedido devem ser do mesmo vendedor');
    }
    if (primeiro.vendedorId === comprador.id) {
      throw new PedidoInvalidoError('Você não pode comprar o seu próprio produto');
    }

    const itensPedido = itens.map(({ produto, quantidade }) => ItemPedido.de(produto, quantidade));
    const totalEmCentavos = itensPedido.reduce((soma, item) => soma + item.subtotalEmCentavos, 0);

    return new Pedido({
      compradorId: comprador.id,
      compradorNome: comprador.nome,
      vendedorId: primeiro.vendedorId,
      vendedorNome: primeiro.vendedorNome,
      itens: itensPedido,
      total: totalEmCentavos / 100,
      tipoEntrega,
      blocoEncontro: Pedido.#definirBlocoEncontro(tipoEntrega, blocoEncontro, itens),
      status: StatusPedido.PENDENTE,
      criadoEm: new Date(),
    });
  }

  /** ENTREGA: o comprador escolhe o bloco. RETIRADA: é o bloco onde o vendedor deixa o produto. */
  static #definirBlocoEncontro(tipoEntrega, blocoInformado, itens) {
    if (tipoEntrega === TipoEntrega.ENTREGA) {
      if (!blocoInformado) throw new PedidoInvalidoError('Informe o bloco do encontro para a entrega');
      return blocoInformado;
    }
    const blocos = new Set(itens.map(({ produto }) => produto.bloco));
    if (blocos.size > 1) {
      throw new PedidoInvalidoError('Os itens estão em blocos diferentes: escolha entrega ou faça pedidos separados');
    }
    return [...blocos][0];
  }

  ehComprador(usuarioId) {
    return this.compradorId === usuarioId;
  }

  ehVendedor(usuarioId) {
    return this.vendedorId === usuarioId;
  }

  garantirParticipante(usuarioId) {
    if (!this.ehComprador(usuarioId) && !this.ehVendedor(usuarioId)) throw new AcessoNegadoError();
  }

  /**
   * Regras de mudança de status:
   * - CANCELADO: comprador ou vendedor, enquanto o pedido não foi entregue nem cancelado.
   * - demais: só o vendedor, avançando um passo por vez.
   */
  alterarStatus(novoStatus, usuarioId) {
    this.garantirParticipante(usuarioId);

    if (novoStatus === StatusPedido.CANCELADO) {
      if (!STATUS_CANCELAVEIS.includes(this.status)) {
        throw new TransicaoInvalidaError(`Pedido ${this.status} não pode ser cancelado`);
      }
    } else {
      if (!this.ehVendedor(usuarioId)) {
        throw new AcessoNegadoError(`Só o vendedor pode marcar o pedido como ${novoStatus}`);
      }
      if (PROXIMO_STATUS[this.status] !== novoStatus) {
        throw new TransicaoInvalidaError(`Pedido ${this.status} não pode ir para ${novoStatus}`);
      }
    }
    return new Pedido({ ...this, status: novoStatus });
  }
}
