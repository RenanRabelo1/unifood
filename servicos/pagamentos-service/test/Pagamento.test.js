import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AcessoNegadoError, PagamentoInvalidoError, TransicaoInvalidaError } from '../src/erros.js';
import { Pagamento } from '../src/domain/Pagamento.js';
import { StatusPagamento } from '../src/domain/StatusPagamento.js';
import { comprador, dadosPagamento } from './fakes.js';

const criar = (extra = {}) => new Pagamento({ ...Pagamento.criar({ comprador, ...dadosPagamento, ...extra }), id: 1 });

test('nasce PENDENTE, com o usuário autenticado como comprador e sem data de confirmação', () => {
  const p = criar();
  assert.equal(p.status, StatusPagamento.PENDENTE);
  assert.equal(p.compradorId, 'c1');
  assert.equal(p.vendedorId, 'v1');
  assert.equal(p.confirmadoEm, null);
});

test('recusa método inválido, valor zero ou negativo, e comprador igual ao vendedor', () => {
  assert.throws(() => criar({ metodo: 'FIADO' }), PagamentoInvalidoError);
  assert.throws(() => criar({ valor: 0 }), PagamentoInvalidoError);
  assert.throws(() => criar({ valor: -5 }), PagamentoInvalidoError);
  assert.throws(() => criar({ vendedorId: 'c1' }), /mesma pessoa/);
});

test('vendedor confirma: vira CONFIRMADO e registra quando', () => {
  const confirmado = criar().confirmar('v1');
  assert.equal(confirmado.status, StatusPagamento.CONFIRMADO);
  assert.ok(confirmado.confirmadoEm instanceof Date);
});

test('comprador não confirma o próprio pagamento', () => {
  assert.throws(() => criar().confirmar('c1'), AcessoNegadoError);
});

test('comprador e vendedor podem cancelar um pagamento pendente', () => {
  assert.equal(criar().cancelar('c1').status, StatusPagamento.CANCELADO);
  assert.equal(criar().cancelar('v1').status, StatusPagamento.CANCELADO);
});

test('quem não participa não confirma nem cancela', () => {
  assert.throws(() => criar().confirmar('intruso'), AcessoNegadoError);
  assert.throws(() => criar().cancelar('intruso'), AcessoNegadoError);
  assert.throws(() => criar().garantirParticipante('intruso'), AcessoNegadoError);
});

test('estados finais não mudam: confirmado não cancela, cancelado não confirma nem cancela de novo', () => {
  const confirmado = criar().confirmar('v1');
  assert.throws(() => confirmado.cancelar('c1'), TransicaoInvalidaError);
  assert.throws(() => confirmado.confirmar('v1'), TransicaoInvalidaError);
  const cancelado = criar().cancelar('c1');
  assert.throws(() => cancelado.confirmar('v1'), TransicaoInvalidaError);
  assert.throws(() => cancelado.cancelar('v1'), TransicaoInvalidaError);
});

test('confirmar devolve outro pagamento e não muda o original', () => {
  const p = criar();
  p.confirmar('v1');
  assert.equal(p.status, StatusPagamento.PENDENTE);
});
