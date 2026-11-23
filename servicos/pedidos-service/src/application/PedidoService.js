import { PedidoInvalidoError, PedidoNaoEncontradoError } from '../erros.js';
import { Pedido } from '../domain/Pedido.js';
import { StatusPedido } from '../domain/StatusPedido.js';

/**
 * Contratos (portas) que este caso de uso precisa. A infraestrutura os implementa (DIP);
 * assim a regra não depende de MySQL nem de HTTP, e nos testes entram versões falsas.
 *
 * Portas de saída (DIP + ISP): contratos pequenos que a aplicação precisa.
 * Os casos de uso dependem destes contratos; as implementações ficam em `infrastructure`.
 *
 * @typedef {import('../domain/Pedido.js').Pedido} Pedido
 *
 * @typedef {Object} PedidoRepository
 * @property {(pedido: Pedido) => Promise<Pedido>} salvar                 devolve o pedido já com id
 * @property {(id: number) => Promise<Pedido|null>} buscarPorId
 * @property {(compradorId: string) => Promise<Pedido[]>} listarPorComprador
 * @property {(vendedorId: string) => Promise<Pedido[]>} listarPorVendedor
 * @property {(id: number, status: string) => Promise<void>} atualizarStatus
 *
 * @typedef {Object} UsuarioAutenticado
 * @property {string} id
 * @property {string} nome
 *
 * @typedef {Object} UsuariosGateway
 * @property {(authorization: string) => Promise<UsuarioAutenticado|null>} validarToken   null se o token for inválido
 *
 * @typedef {Object} Produto
 * @property {string} id
 * @property {string} nome
 * @property {number} preco
 * @property {string} bloco
 * @property {boolean} disponivel
 * @property {string} vendedorId
 * @property {string} vendedorNome
 *
 * @typedef {Object} ProdutosGateway
 * @property {(id: string) => Promise<Produto|null>} buscarPorId                          null se não existir
 *
 * @typedef {Object} PagamentosGateway
 * @property {(dados: {pedidoId: number, valor: number, metodo: string, vendedorId: string}, authorization: string) => Promise<void>} registrar
 */

/**
 * Casos de uso de pedidos.
 * GRASP Controller: coordena o caso de uso; as regras ficam no Pedido e o I/O nas portas.
 */
export class PedidoService {
  /**
   * @param {{
   *   repositorio: PedidoRepository,
   *   produtos: ProdutosGateway,
   *   pagamentos: PagamentosGateway,
   * }} deps
   */
  constructor({ repositorio, produtos, pagamentos }) {
    this.repositorio = repositorio;
    this.produtos = produtos;
    this.pagamentos = pagamentos;
  }

  /**
   * Criar pedido: busca preço e vendedor no serviço de Produtos, valida e calcula o total (no Pedido),
   * salva como PENDENTE e pede ao serviço de Pagamentos que registre o pagamento.
   * Se o pagamento não puder ser registrado, o pedido é cancelado para não ficar um pedido sem pagamento.
   */
  async criar({ comprador, itens, tipoEntrega, blocoEncontro, metodoPagamento, authorization }) {
    const itensComProduto = await Promise.all(itens.map(async ({ produtoId, quantidade }) => {
      const produto = await this.produtos.buscarPorId(produtoId);
      if (!produto) throw new PedidoInvalidoError(`Produto ${produtoId} não encontrado`);
      return { produto, quantidade };
    }));

    const pedido = await this.repositorio.salvar(
      Pedido.criar({ comprador, itens: itensComProduto, tipoEntrega, blocoEncontro }),
    );

    try {
      await this.pagamentos.registrar(
        { pedidoId: pedido.id, valor: pedido.total, metodo: metodoPagamento, vendedorId: pedido.vendedorId },
        authorization,
      );
    } catch (erro) {
      await this.#cancelarSemMascararErro(pedido, erro);
      throw erro;
    }
    return pedido;
  }

  listarMeus(usuarioId) {
    return this.repositorio.listarPorComprador(usuarioId);
  }

  listarRecebidos(usuarioId) {
    return this.repositorio.listarPorVendedor(usuarioId);
  }

  async buscar(id, usuarioId) {
    const pedido = await this.#obter(id);
    pedido.garantirParticipante(usuarioId);
    return pedido;
  }

  async alterarStatus(id, novoStatus, usuarioId) {
    const atualizado = (await this.#obter(id)).alterarStatus(novoStatus, usuarioId);
    await this.repositorio.atualizarStatus(id, atualizado.status);
    return atualizado;
  }

  async #obter(id) {
    const pedido = await this.repositorio.buscarPorId(id);
    if (!pedido) throw new PedidoNaoEncontradoError();
    return pedido;
  }

  async #cancelarSemMascararErro(pedido, erroOriginal) {
    try {
      await this.repositorio.atualizarStatus(pedido.id, StatusPedido.CANCELADO);
    } catch (erroAoCancelar) {
      // O erro que importa para o cliente é o do pagamento; este só vai para o log.
      console.error(`Pedido ${pedido.id}: falha ao cancelar após erro de pagamento (${erroOriginal.message})`, erroAoCancelar);
    }
  }
}
