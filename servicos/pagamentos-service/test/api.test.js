import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { criarApp } from '../src/app.js';
import { PagamentoService } from '../src/application/PagamentoService.js';
import { RepositorioEmMemoria, UsuariosGatewayFake } from './fakes.js';

/** Sobe o servidor Express de verdade; só banco e serviço de Usuários são falsos. */
let servidor = null;
let base;

const CAIO = 'Bearer token-caio';
const VERA = 'Bearer token-vera';
const INTRUSO = 'Bearer token-intruso';

beforeEach(async () => {
  if (servidor) await new Promise((ok) => servidor.close(ok));
  const app = criarApp({
    usuarios: new UsuariosGatewayFake({
      [CAIO]: { id: 'c1', nome: 'Caio' },
      [VERA]: { id: 'v1', nome: 'Vera' },
      [INTRUSO]: { id: 'x9', nome: 'Intruso' },
    }),
    pagamentoService: new PagamentoService({ repositorio: new RepositorioEmMemoria() }),
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

const novo = { pedidoId: 1, valor: 7.3, metodo: 'PIX', vendedorId: 'v1' };
const registrar = (corpo = novo, token = CAIO) => chamar('/pagamentos', { metodo: 'POST', corpo, token });
const acao = (id, nome, token) => chamar(`/pagamentos/${id}/${nome}`, { metodo: 'PATCH', token });

test('GET /health não exige token', async () => {
  const r = await chamar('/health');
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { status: 'ok', servico: 'pagamentos' });
});

test('rotas de pagamentos sem token ou com token ruim devolvem 401', async () => {
  assert.equal((await chamar('/pagamentos/pedido/1')).status, 401);
  assert.equal((await chamar('/pagamentos/pedido/1', { token: 'Bearer lixo' })).status, 401);
  assert.equal((await chamar('/pagamentos', { metodo: 'POST', corpo: novo })).status, 401);
});

test('POST /pagamentos devolve 201 no formato do contrato, PENDENTE e sem confirmadoEm', async () => {
  const r = await registrar();
  assert.equal(r.status, 201);
  const p = await r.json();
  assert.deepEqual(
    { ...p, criadoEm: typeof p.criadoEm },
    {
      id: 1, pedidoId: 1, compradorId: 'c1', vendedorId: 'v1', valor: 7.3, metodo: 'PIX',
      status: 'PENDENTE', criadoEm: 'string', confirmadoEm: null,
    },
  );
});

test('o comprador é sempre o dono do token: um campo compradorId enviado é ignorado', async () => {
  const p = await (await registrar({ ...novo, compradorId: 'outra-pessoa' })).json();
  assert.equal(p.compradorId, 'c1');
});

test('POST /pagamentos inválido devolve 400 listando os problemas', async () => {
  const r = await registrar({ pedidoId: 0, valor: -1, metodo: 'FIADO', vendedorId: '' });
  assert.equal(r.status, 400);
  const { erro } = await r.json();
  for (const campo of ['pedidoId', 'valor', 'metodo', 'vendedorId']) assert.match(erro, new RegExp(campo));
  assert.equal((await registrar({ ...novo, valor: '7.3' })).status, 400);
  assert.equal((await registrar({ ...novo, valor: 7.333 })).status, 400);
  assert.equal((await chamar('/pagamentos', { metodo: 'POST', corpo: '{quebrado', token: CAIO })).status, 400);
});

test('comprador igual ao vendedor devolve 400; pagamento repetido do mesmo pedido devolve 409', async () => {
  assert.equal((await registrar(novo, VERA)).status, 400);
  assert.equal((await registrar()).status, 201);
  const r = await registrar();
  assert.equal(r.status, 409);
  assert.deepEqual(await r.json(), { erro: 'Já existe um pagamento para este pedido' });
});

test('GET /pagamentos/pedido/:id: participantes veem, intruso 403, inexistente 404, id ruim 400', async () => {
  await registrar();
  assert.equal((await chamar('/pagamentos/pedido/1', { token: CAIO })).status, 200);
  assert.equal((await chamar('/pagamentos/pedido/1', { token: VERA })).status, 200);
  assert.equal((await chamar('/pagamentos/pedido/1', { token: INTRUSO })).status, 403);
  assert.equal((await chamar('/pagamentos/pedido/99', { token: CAIO })).status, 404);
  assert.equal((await chamar('/pagamentos/pedido/abc', { token: CAIO })).status, 400);
});

test('confirmar: comprador não pode (403), vendedor pode e fica registrado quando', async () => {
  await registrar();
  assert.equal((await acao(1, 'confirmar', CAIO)).status, 403);
  const r = await acao(1, 'confirmar', VERA);
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.status, 'CONFIRMADO');
  assert.ok(p.confirmadoEm);
});

test('cancelar: comprador ou vendedor; depois de cancelado não muda mais (409)', async () => {
  await registrar();
  assert.equal((await acao(1, 'cancelar', CAIO)).status, 200);
  assert.equal((await acao(1, 'cancelar', VERA)).status, 409);
  assert.equal((await acao(1, 'confirmar', VERA)).status, 409);
});

test('pagamento confirmado não pode ser cancelado (409)', async () => {
  await registrar();
  await acao(1, 'confirmar', VERA);
  assert.equal((await acao(1, 'cancelar', CAIO)).status, 409);
});

test('intruso 403, inexistente 404, id inválido 400 ao confirmar/cancelar', async () => {
  await registrar();
  assert.equal((await acao(1, 'cancelar', INTRUSO)).status, 403);
  assert.equal((await acao(99, 'confirmar', VERA)).status, 404);
  assert.equal((await acao('abc', 'cancelar', CAIO)).status, 400);
});

test('rota desconhecida devolve 404 em JSON', async () => {
  const r = await chamar('/nada');
  assert.equal(r.status, 404);
  assert.deepEqual(await r.json(), { erro: 'Rota não encontrada' });
});
