import { AcessoNegadoError, PagamentoInvalidoError, TransicaoInvalidaError } from '../erros.js';
import { MetodoPagamento, StatusPagamento } from './StatusPagamento.js';

/**
 * Entidade de domínio. Não conhece Express, MySQL nem HTTP.
 * Imutável: confirmar ou cancelar devolve um novo Pagamento.
 * GRASP Information Expert: o Pagamento sabe quem pode vê-lo, confirmá-lo ou cancelá-lo.
 *
 * O pagamento é SIMULADO: não há cobrança real. "Confirmar" é o vendedor dizendo que recebeu o valor.
 */
export class Pagamento {
  constructor({ id = null, pedidoId, compradorId, vendedorId, valor, metodo, status, criadoEm, confirmadoEm = null }) {
    this.id = id;
    this.pedidoId = pedidoId;
    this.compradorId = compradorId;
    this.vendedorId = vendedorId;
    this.valor = valor;
    this.metodo = metodo;
    this.status = status;
    this.criadoEm = criadoEm;
    this.confirmadoEm = confirmadoEm;
    Object.freeze(this);
  }

  /** GRASP Creator: o comprador é sempre o usuário autenticado e o pagamento sempre começa PENDENTE. */
  static criar({ comprador, pedidoId, valor, metodo, vendedorId }) {
    if (!Object.values(MetodoPagamento).includes(metodo)) {
      throw new PagamentoInvalidoError(`Método de pagamento inválido: ${metodo}`);
    }
    if (!(valor > 0)) throw new PagamentoInvalidoError('O valor do pagamento deve ser maior que zero');
    if (vendedorId === comprador.id) {
      throw new PagamentoInvalidoError('Comprador e vendedor não podem ser a mesma pessoa');
    }
    return new Pagamento({
      pedidoId,
      compradorId: comprador.id,
      vendedorId,
      valor,
      metodo,
      status: StatusPagamento.PENDENTE,
      criadoEm: new Date(),
    });
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

  /** Só o vendedor confirma (é ele quem sabe se recebeu), e só enquanto estiver PENDENTE. */
  confirmar(usuarioId) {
    this.garantirParticipante(usuarioId);
    if (!this.ehVendedor(usuarioId)) throw new AcessoNegadoError('Só o vendedor pode confirmar o pagamento');
    this.#garantirPendente(StatusPagamento.CONFIRMADO);
    return new Pagamento({ ...this, status: StatusPagamento.CONFIRMADO, confirmadoEm: new Date() });
  }

  /** Comprador ou vendedor cancelam, mas só enquanto estiver PENDENTE: pagamento confirmado é definitivo. */
  cancelar(usuarioId) {
    this.garantirParticipante(usuarioId);
    this.#garantirPendente(StatusPagamento.CANCELADO);
    return new Pagamento({ ...this, status: StatusPagamento.CANCELADO });
  }

  #garantirPendente(destino) {
    if (this.status !== StatusPagamento.PENDENTE) {
      throw new TransicaoInvalidaError(`Pagamento ${this.status} não pode ir para ${destino}`);
    }
  }
}
