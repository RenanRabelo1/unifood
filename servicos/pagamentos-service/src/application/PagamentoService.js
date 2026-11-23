import { PagamentoJaExisteError, PagamentoNaoEncontradoError, TransicaoInvalidaError } from '../erros.js';
import { Pagamento } from '../domain/Pagamento.js';

/**
 * Contratos (portas) que este caso de uso precisa. A infraestrutura os implementa (DIP);
 * assim a regra não depende de MySQL nem de HTTP, e nos testes entram versões falsas.
 *
 * Portas de saída (DIP + ISP): contratos pequenos que a aplicação precisa.
 * Os casos de uso dependem destes contratos; as implementações ficam em `infrastructure`.
 *
 * @typedef {import('../domain/Pagamento.js').Pagamento} Pagamento
 *
 * @typedef {Object} PagamentoRepository
 * @property {(pagamento: Pagamento) => Promise<Pagamento>} salvar          devolve com id; lança PagamentoJaExisteError se o pedido já tem pagamento
 * @property {(id: number) => Promise<Pagamento|null>} buscarPorId
 * @property {(pedidoId: number) => Promise<Pagamento|null>} buscarPorPedidoId
 * @property {(pagamento: Pagamento, statusEsperado: string) => Promise<boolean>} atualizar
 *           grava status/confirmadoEm só se o status atual ainda for `statusEsperado`; false se outra requisição chegou antes
 *
 * @typedef {Object} UsuarioAutenticado
 * @property {string} id
 * @property {string} nome
 *
 * @typedef {Object} UsuariosGateway
 * @property {(authorization: string) => Promise<UsuarioAutenticado|null>} validarToken   null se o token for inválido
 */

/**
 * Casos de uso de pagamento (simulado).
 * GRASP Controller: coordena o caso de uso; as regras ficam no Pagamento e o I/O nas portas.
 */
export class PagamentoService {
  /** @param {{repositorio: PagamentoRepository}} deps */
  constructor({ repositorio }) {
    this.repositorio = repositorio;
  }

  /** Chamado pelo serviço de Pedidos logo depois de criar o pedido. Um pedido só pode ter um pagamento. */
  async registrar({ comprador, pedidoId, valor, metodo, vendedorId }) {
    if (await this.repositorio.buscarPorPedidoId(pedidoId)) throw new PagamentoJaExisteError();
    return this.repositorio.salvar(Pagamento.criar({ comprador, pedidoId, valor, metodo, vendedorId }));
  }

  async buscarPorPedido(pedidoId, usuarioId) {
    const pagamento = await this.repositorio.buscarPorPedidoId(pedidoId);
    if (!pagamento) throw new PagamentoNaoEncontradoError();
    pagamento.garantirParticipante(usuarioId);
    return pagamento;
  }

  confirmar(id, usuarioId) {
    return this.#mudarStatus(id, (pagamento) => pagamento.confirmar(usuarioId));
  }

  cancelar(id, usuarioId) {
    return this.#mudarStatus(id, (pagamento) => pagamento.cancelar(usuarioId));
  }

  async #mudarStatus(id, transicao) {
    const atual = await this.repositorio.buscarPorId(id);
    if (!atual) throw new PagamentoNaoEncontradoError();

    const novo = transicao(atual); // aplica as regras (quem pode, a partir de qual status)
    // Se duas requisições chegarem juntas (ex.: confirmar e cancelar), só a primeira consegue gravar.
    if (!(await this.repositorio.atualizar(novo, atual.status))) {
      throw new TransicaoInvalidaError('O pagamento mudou de status enquanto você tentava alterá-lo');
    }
    return novo;
  }
}
