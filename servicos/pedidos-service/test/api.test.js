import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { criarApp } from '../src/app.js';
import { PedidoService } from '../src/application/PedidoService.js';
import {
  PagamentosGatewayFake, ProdutosGatewayFake, RepositorioEmMemoria, UsuariosGatewayFake, brigadeiro, coxinha,
} from './fakes.js';

/** Sobe o servidor Express de verdade; só banco e serviços vizinhos são falsos. */
let servidor = null;
let base;
let pagamentos;

const CAIO = 'Bearer token-caio';
const VERA = 'Bearer token-vera';
const INTRUSO = 'Bearer token-intruso';

beforeEach(async () => {
  if (servidor) await new Promise((ok) => servidor.close(ok));
  pagamentos = new PagamentosGatewayFake();
  const app = criarApp({
    usuarios: new UsuariosGatewayFake({
      [CAIO]: { id: 'c1', nome: 'Caio' },
      [VERA]: { id: 'v1', nome: 'Vera' },
      [INTRUSO]: { id: 'x9', nome: 'Intruso' },
    }),
    pedidoService: new PedidoService({
      repositorio: new RepositorioEmMemoria(),
      produtos: new ProdutosGatewayFake([brigadeiro, coxinha]),
      pagamentos,
    }),
  });
  await new Promise((ok) => { servidor = app.listen(0, ok); });
  base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor?.close());

const chamar = (caminho, { metodo = 'GET', corpo, token } = {}) =>
  fetch(base + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: token }) },
    body: corpo === undefined ? undefined : typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });

const novoPedido = { itens: [{ produtoId: 'p1', quantidade: 2 }], tipoEntrega: 'RETIRADA', metodoPagamento: 'PIX' };
const criar = (corpo = novoPedido, token = CAIO) => chamar('/pedidos', { metodo: 'POST', corpo, token });

test('GET /health não exige token', async () => {
  const r = await chamar('/health');
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { status: 'ok', servico: 'pedidos' });
});

test('rotas de pedidos sem token ou com token ruim devolvem 401', async () => {
  assert.equal((await chamar('/pedidos/meus')).status, 401);
  assert.equal((await chamar('/pedidos/meus', { token: 'Bearer lixo' })).status, 401);
  assert.equal((await chamar('/pedidos', { metodo: 'POST', corpo: novoPedido })).status, 401);
});

test('POST /pedidos devolve 201 no formato do contrato e registra o pagamento', async () => {
  const r = await criar();
  assert.equal(r.status, 201);
  const p = await r.json();
  assert.deepEqual(
    { ...p, criadoEm: typeof p.criadoEm },
    {
      id: 1, compradorId: 'c1', compradorNome: 'Caio', vendedorId: 'v1', vendedorNome: 'Vera',
      itens: [{ produtoId: 'p1', nome: 'Brigadeiro', precoUnitario: 3.5, quantidade: 2 }],
      total: 7, tipoEntrega: 'RETIRADA', blocoEncontro: 'Bloco A', status: 'PENDENTE', criadoEm: 'string',
    },
  );
  assert.equal(pagamentos.chamadas.length, 1);
  assert.equal(pagamentos.chamadas[0].authorization, CAIO);
});

test('o preço vem do serviço de Produtos: preço enviado pelo cliente é ignorado', async () => {
  const corpo = { ...novoPedido, itens: [{ produtoId: 'p1', quantidade: 1, precoUnitario: 0.01 }], total: 0.01 };
  assert.equal((await (await criar(corpo)).json()).total, 3.5);
});

test('na retirada, o bloco enviado pelo cliente é ignorado; na entrega, é usado', async () => {
  assert.equal((await (await criar({ ...novoPedido, blocoEncontro: 'Bloco Z' })).json()).blocoEncontro, 'Bloco A');
  const entrega = await (await criar({ ...novoPedido, tipoEntrega: 'ENTREGA', blocoEncontro: 'Bloco C' })).json();
  assert.equal(entrega.blocoEncontro, 'Bloco C');
});

test('itens repetidos do mesmo produto são somados', async () => {
  const corpo = { ...novoPedido, itens: [{ produtoId: 'p1', quantidade: 1 }, { produtoId: 'p1', quantidade: 2 }] };
  const p = await (await criar(corpo)).json();
  assert.equal(p.itens.length, 1);
  assert.equal(p.itens[0].quantidade, 3);
});

test('POST /pedidos inválido devolve 400 listando os problemas', async () => {
  const r = await criar({ itens: [], tipoEntrega: 'VOANDO', metodoPagamento: 'FIADO' });
  assert.equal(r.status, 400);
  const { erro } = await r.json();
  assert.match(erro, /itens/);
  assert.match(erro, /tipoEntrega/);
  assert.match(erro, /metodoPagamento/);
  assert.equal((await criar({ ...novoPedido, itens: [{ produtoId: 'p1', quantidade: 0 }] })).status, 400);
  assert.equal((await criar({ ...novoPedido, itens: [{ produtoId: 'p1', quantidade: 1.5 }] })).status, 400);
  assert.equal((await criar({ ...novoPedido, tipoEntrega: 'ENTREGA' })).status, 400);
  assert.equal((await chamar('/pedidos', { metodo: 'POST', corpo: '{quebrado', token: CAIO })).status, 400);
});

test('regras de negócio devolvem 400: produto inexistente e compra do próprio produto', async () => {
  const inexistente = await criar({ ...novoPedido, itens: [{ produtoId: 'zzz', quantidade: 1 }] });
  assert.equal(inexistente.status, 400);
  assert.match((await inexistente.json()).erro, /não encontrado/);
  assert.equal((await criar(novoPedido, VERA)).status, 400);
});

test('se o pagamento falha, devolve 503 e o pedido fica cancelado', async () => {
  pagamentos.falhar = true;
  const r = await criar();
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { erro: 'Serviço de pagamentos indisponível' });
  const meus = await (await chamar('/pedidos/meus', { token: CAIO })).json();
  assert.equal(meus[0].status, 'CANCELADO');
});

test('meus x recebidos', async () => {
  await criar();
  assert.equal((await (await chamar('/pedidos/meus', { token: CAIO })).json()).length, 1);
  assert.equal((await (await chamar('/pedidos/recebidos', { token: CAIO })).json()).length, 0);
  assert.equal((await (await chamar('/pedidos/recebidos', { token: VERA })).json()).length, 1);
});

test('GET /pedidos/:id: participantes veem (200), outros 403, inexistente 404, id inválido 400', async () => {
  await criar();
  assert.equal((await chamar('/pedidos/1', { token: CAIO })).status, 200);
  assert.equal((await chamar('/pedidos/1', { token: VERA })).status, 200);
  assert.equal((await chamar('/pedidos/1', { token: INTRUSO })).status, 403);
  assert.equal((await chamar('/pedidos/99', { token: CAIO })).status, 404);
  assert.equal((await chamar('/pedidos/abc', { token: CAIO })).status, 400);
});

const mudar = (id, status, token) => chamar(`/pedidos/${id}/status`, { metodo: 'PATCH', corpo: { status }, token });

test('PATCH status: vendedor avança em sequência; fora de ordem dá 409', async () => {
  await criar();
  assert.equal((await mudar(1, 'PRONTO', VERA)).status, 409);
  for (const s of ['CONFIRMADO', 'PRONTO', 'ENTREGUE']) {
    const r = await mudar(1, s, VERA);
    assert.equal(r.status, 200);
    assert.equal((await r.json()).status, s);
  }
});

test('PATCH status: comprador não avança (403) mas cancela; depois de cancelado não cancela de novo (409)', async () => {
  await criar();
  assert.equal((await mudar(1, 'CONFIRMADO', CAIO)).status, 403);
  assert.equal((await mudar(1, 'CANCELADO', CAIO)).status, 200);
  assert.equal((await mudar(1, 'CANCELADO', VERA)).status, 409);
});

test('PATCH status: intruso 403, pedido inexistente 404, status desconhecido 400', async () => {
  await criar();
  assert.equal((await mudar(1, 'CANCELADO', INTRUSO)).status, 403);
  assert.equal((await mudar(99, 'CONFIRMADO', VERA)).status, 404);
  assert.equal((await mudar(1, 'EXPLODIU', VERA)).status, 400);
});

test('rota desconhecida devolve 404 em JSON', async () => {
  const r = await chamar('/nada');
  assert.equal(r.status, 404);
  assert.deepEqual(await r.json(), { erro: 'Rota não encontrada' });
});
