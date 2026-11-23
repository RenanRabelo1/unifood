import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { PagamentoService } from '../src/application/PagamentoService.js';
import {
  AcessoNegadoError, PagamentoJaExisteError, PagamentoNaoEncontradoError, TransicaoInvalidaError,
} from '../src/erros.js';
import { RepositorioEmMemoria, comprador, dadosPagamento } from './fakes.js';

let repositorio;
let service;

beforeEach(() => {
  repositorio = new RepositorioEmMemoria();
  service = new PagamentoService({ repositorio });
});

const registrar = (extra = {}) => service.registrar({ comprador, ...dadosPagamento, ...extra });

test('registra o pagamento como PENDENTE', async () => {
  const p = await registrar();
  assert.equal(p.id, 1);
  assert.equal(p.status, 'PENDENTE');
  assert.equal(p.valor, 7.3);
});

test('um pedido só pode ter um pagamento', async () => {
  await registrar();
  await assert.rejects(registrar(), PagamentoJaExisteError);
  assert.equal(repositorio.dados.size, 1);
});

test('buscar por pedido: participantes veem, outros não, inexistente dá não encontrado', async () => {
  await registrar();
  assert.equal((await service.buscarPorPedido(1, 'c1')).id, 1);
  assert.equal((await service.buscarPorPedido(1, 'v1')).id, 1);
  await assert.rejects(service.buscarPorPedido(1, 'intruso'), AcessoNegadoError);
  await assert.rejects(service.buscarPorPedido(99, 'c1'), PagamentoNaoEncontradoError);
});

test('confirmar e cancelar persistem a mudança', async () => {
  await registrar();
  await service.confirmar(1, 'v1');
  assert.equal(repositorio.dados.get(1).status, 'CONFIRMADO');

  await registrar({ pedidoId: 2 });
  await service.cancelar(2, 'c1');
  assert.equal(repositorio.dados.get(2).status, 'CANCELADO');
});

test('id inexistente dá não encontrado', async () => {
  await assert.rejects(service.confirmar(99, 'v1'), PagamentoNaoEncontradoError);
  await assert.rejects(service.cancelar(99, 'c1'), PagamentoNaoEncontradoError);
});

test('se outra requisição mudar o status no meio, a segunda perde em vez de sobrescrever', async () => {
  await registrar();
  repositorio.perderCorrida = true;
  await assert.rejects(service.cancelar(1, 'c1'), TransicaoInvalidaError);
  assert.equal(repositorio.dados.get(1).status, 'PENDENTE');
});
