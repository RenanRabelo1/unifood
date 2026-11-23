import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AcessoNegadoError, PedidoInvalidoError, TransicaoInvalidaError } from '../src/erros.js';
import { Pedido } from '../src/domain/Pedido.js';
import { StatusPedido } from '../src/domain/StatusPedido.js';
import { brigadeiro, coxinha, comprador } from './fakes.js';

const criar = (extra = {}) => Pedido.criar({
  comprador,
  itens: [{ produto: brigadeiro, quantidade: 2 }],
  tipoEntrega: 'RETIRADA',
  ...extra,
});
const comId = (pedido) => new Pedido({ ...pedido, id: 1 });

test('calcula o total a partir dos preços do produto e começa PENDENTE', () => {
  const p = criar();
  assert.equal(p.total, 7);
  assert.equal(p.status, StatusPedido.PENDENTE);
  assert.equal(p.vendedorId, 'v1');
  assert.equal(p.vendedorNome, 'Vera');
});

test('total não sofre erro de ponto flutuante (0,1 × 3 + 3,5 × 1)', () => {
  const p = criar({ itens: [{ produto: coxinha, quantidade: 3 }, { produto: brigadeiro, quantidade: 1 }] });
  assert.equal(p.total, 3.8);
});

test('retirada usa o bloco do produto', () => {
  assert.equal(criar().blocoEncontro, 'Bloco A');
});

test('entrega usa o bloco informado e exige que ele exista', () => {
  assert.equal(criar({ tipoEntrega: 'ENTREGA', blocoEncontro: 'Bloco C' }).blocoEncontro, 'Bloco C');
  assert.throws(() => criar({ tipoEntrega: 'ENTREGA' }), PedidoInvalidoError);
});

test('retirada de itens em blocos diferentes é recusada', () => {
  const outroBloco = { ...coxinha, bloco: 'Bloco B' };
  assert.throws(
    () => criar({ itens: [{ produto: brigadeiro, quantidade: 1 }, { produto: outroBloco, quantidade: 1 }] }),
    /blocos diferentes/,
  );
});

test('recusa produto indisponível, vendedores diferentes, compra do próprio produto e pedido vazio', () => {
  assert.throws(() => criar({ itens: [{ produto: { ...brigadeiro, disponivel: false }, quantidade: 1 }] }), /indisponível/);
  const deOutro = { ...coxinha, vendedorId: 'v2' };
  assert.throws(
    () => criar({ itens: [{ produto: brigadeiro, quantidade: 1 }, { produto: deOutro, quantidade: 1 }] }),
    /mesmo vendedor/,
  );
  assert.throws(() => criar({ comprador: { id: 'v1', nome: 'Vera' } }), /próprio produto/);
  assert.throws(() => criar({ itens: [] }), PedidoInvalidoError);
});

test('vendedor avança o status um passo por vez até ENTREGUE', () => {
  let p = comId(criar());
  for (const proximo of ['CONFIRMADO', 'PRONTO', 'ENTREGUE']) {
    p = p.alterarStatus(proximo, 'v1');
    assert.equal(p.status, proximo);
  }
});

test('não pula etapas nem volta atrás', () => {
  const p = comId(criar());
  assert.throws(() => p.alterarStatus('PRONTO', 'v1'), TransicaoInvalidaError);
  assert.throws(() => p.alterarStatus('PENDENTE', 'v1'), TransicaoInvalidaError);
});

test('comprador não avança status, só cancela', () => {
  const p = comId(criar());
  assert.throws(() => p.alterarStatus('CONFIRMADO', 'c1'), AcessoNegadoError);
  assert.equal(p.alterarStatus('CANCELADO', 'c1').status, StatusPedido.CANCELADO);
});

test('quem não participa do pedido não mexe nele', () => {
  const p = comId(criar());
  assert.throws(() => p.alterarStatus('CANCELADO', 'intruso'), AcessoNegadoError);
  assert.throws(() => p.garantirParticipante('intruso'), AcessoNegadoError);
});

test('pedido entregue ou cancelado não pode ser cancelado', () => {
  const entregue = comId(criar()).alterarStatus('CONFIRMADO', 'v1').alterarStatus('PRONTO', 'v1').alterarStatus('ENTREGUE', 'v1');
  assert.throws(() => entregue.alterarStatus('CANCELADO', 'v1'), TransicaoInvalidaError);
  const cancelado = comId(criar()).alterarStatus('CANCELADO', 'c1');
  assert.throws(() => cancelado.alterarStatus('CANCELADO', 'v1'), TransicaoInvalidaError);
});

test('alterar status devolve outro pedido e não muda o original', () => {
  const p = comId(criar());
  p.alterarStatus('CONFIRMADO', 'v1');
  assert.equal(p.status, StatusPedido.PENDENTE);
});
