import { Pagamento } from '../src/domain/Pagamento.js';
import { PagamentoJaExisteError } from '../src/erros.js';

/** Implementações em memória das portas: só possíveis porque os casos de uso dependem de contratos (DIP/LSP). */

export class RepositorioEmMemoria {
  dados = new Map();
  proximoId = 1;
  /** Se definido, a próxima chamada a `atualizar` simula outra requisição que chegou antes. */
  perderCorrida = false;

  async salvar(pagamento) {
    if (await this.buscarPorPedidoId(pagamento.pedidoId)) throw new PagamentoJaExisteError();
    const salvo = new Pagamento({ ...pagamento, id: this.proximoId++ });
    this.dados.set(salvo.id, salvo);
    return salvo;
  }
  async buscarPorId(id) {
    return this.dados.get(id) ?? null;
  }
  async buscarPorPedidoId(pedidoId) {
    return [...this.dados.values()].find((p) => p.pedidoId === pedidoId) ?? null;
  }
  async atualizar(pagamento, statusEsperado) {
    if (this.perderCorrida || this.dados.get(pagamento.id).status !== statusEsperado) return false;
    this.dados.set(pagamento.id, pagamento);
    return true;
  }
}

export class UsuariosGatewayFake {
  constructor(usuarios = {}) {
    this.usuarios = usuarios; // { 'Bearer abc': { id, nome } }
  }
  async validarToken(authorization) {
    return this.usuarios[authorization] ?? null;
  }
}

export const comprador = { id: 'c1', nome: 'Caio' };
export const dadosPagamento = { pedidoId: 1, valor: 7.3, metodo: 'PIX', vendedorId: 'v1' };
