import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { PedidoService } from '../src/application/PedidoService.js';
import { ServicoIndisponivelError } from '../src/erros.js';
import { AcessoNegadoError, PedidoInvalidoError, PedidoNaoEncontradoError } from '../src/erros.js';
import {
  PagamentosGatewayFake, ProdutosGatewayFake, RepositorioEmMemoria, brigadeiro, comprador,
} from './fakes.js';

let repositorio;
let pagamentos;
let service;

beforeEach(() => {
  repositorio = new RepositorioEmMemoria();
  pagamentos = new PagamentosGatewayFake();
  service = new PedidoService({ repositorio, produtos: new ProdutosGatewayFake([brigadeiro]), pagamentos });
});

const pedirBrigadeiro = (extra = {}) => service.criar({
  comprador,
  itens: [{ produtoId: 'p1', quantidade: 2 }],
  tipoEntrega: 'RETIRADA',
  metodoPagamento: 'PIX',
  authorization: 'Bearer abc',
  ...extra,
});

test('cria o pedido e registra o pagamento repassando o token do comprador', async () => {
  const pedido = await pedirBrigadeiro();
  assert.equal(pedido.id, 1);
  assert.equal(pedido.total, 7);
  assert.deepEqual(pagamentos.chamadas, [{
    dados: { pedidoId: 1, valor: 7, metodo: 'PIX', vendedorId: 'v1' },
    authorization: 'Bearer abc',
  }]);
});

test('produto inexistente recusa o pedido sem salvar nada nem cobrar', async () => {
  await assert.rejects(pedirBrigadeiro({ itens: [{ produtoId: 'nao-existe', quantidade: 1 }] }), PedidoInvalidoError);
  assert.equal(repositorio.dados.size, 0);
  assert.equal(pagamentos.chamadas.length, 0);
});

test('se o pagamento falha, o pedido fica CANCELADO e o erro chega ao cliente', async () => {
  pagamentos.falhar = true;
  await assert.rejects(pedirBrigadeiro(), ServicoIndisponivelError);
  assert.equal(repositorio.dados.get(1).status, 'CANCELADO');
});

test('listar meus e recebidos separa comprador de vendedor', async () => {
  await pedirBrigadeiro();
  assert.equal((await service.listarMeus('c1')).length, 1);
  assert.equal((await service.listarMeus('v1')).length, 0);
  assert.equal((await service.listarRecebidos('v1')).length, 1);
  assert.equal((await service.listarRecebidos('c1')).length, 0);
});

test('buscar: participantes veem, outros não, inexistente dá não encontrado', async () => {
  await pedirBrigadeiro();
  assert.equal((await service.buscar(1, 'c1')).id, 1);
  assert.equal((await service.buscar(1, 'v1')).id, 1);
  await assert.rejects(service.buscar(1, 'intruso'), AcessoNegadoError);
  await assert.rejects(service.buscar(99, 'c1'), PedidoNaoEncontradoError);
});

test('alterar status persiste a mudança', async () => {
  await pedirBrigadeiro();
  await service.alterarStatus(1, 'CONFIRMADO', 'v1');
  assert.equal(repositorio.dados.get(1).status, 'CONFIRMADO');
  await assert.rejects(service.alterarStatus(99, 'CONFIRMADO', 'v1'), PedidoNaoEncontradoError);
});
