import { Pedido } from '../src/domain/Pedido.js';
import { ServicoIndisponivelError } from '../src/erros.js';

/** Implementações em memória das portas: só possíveis porque os casos de uso dependem de contratos (DIP/LSP). */

export class RepositorioEmMemoria {
  dados = new Map();
  proximoId = 1;

  async salvar(pedido) {
    const salvo = new Pedido({ ...pedido, id: this.proximoId++ });
    this.dados.set(salvo.id, salvo);
    return salvo;
  }
  async buscarPorId(id) {
    return this.dados.get(id) ?? null;
  }
  async listarPorComprador(id) {
    return [...this.dados.values()].filter((p) => p.compradorId === id);
  }
  async listarPorVendedor(id) {
    return [...this.dados.values()].filter((p) => p.vendedorId === id);
  }
  async atualizarStatus(id, status) {
    this.dados.set(id, new Pedido({ ...this.dados.get(id), status }));
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

export class ProdutosGatewayFake {
  constructor(produtos = []) {
    this.produtos = new Map(produtos.map((p) => [p.id, p]));
  }
  async buscarPorId(id) {
    return this.produtos.get(id) ?? null;
  }
}

export class PagamentosGatewayFake {
  chamadas = [];
  falhar = false;

  async registrar(dados, authorization) {
    if (this.falhar) throw new ServicoIndisponivelError('pagamentos');
    this.chamadas.push({ dados, authorization });
  }
}

export const brigadeiro = {
  id: 'p1', nome: 'Brigadeiro', preco: 3.5, bloco: 'Bloco A', disponivel: true, vendedorId: 'v1', vendedorNome: 'Vera',
};
export const coxinha = {
  id: 'p2', nome: 'Coxinha', preco: 0.1, bloco: 'Bloco A', disponivel: true, vendedorId: 'v1', vendedorNome: 'Vera',
};
export const comprador = { id: 'c1', nome: 'Caio' };
