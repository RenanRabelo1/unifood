import { Router } from 'express';
import { paraPagamentoResponse } from './dto.js';
import { autenticar } from './middlewares/autenticar.js';
import { validarId, validarRegistro } from './validadores.js';

/** Express 4 não captura rejeições de handlers async sozinho: este wrapper repassa o erro ao tratador. */
const assincrono = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

/** Controllers: só traduzem HTTP <-> casos de uso. Nenhuma regra de negócio aqui. */
export function criarRotas({ pagamentoService, usuarios }) {
  const router = Router();

  router.get('/health', (_req, res) => res.json({ status: 'ok', servico: 'pagamentos' }));

  // Todas as rotas abaixo exigem token válido.
  router.use('/pagamentos', autenticar(usuarios));

  // Registrar pagamento do pedido (chamado pelo serviço de Pedidos, com o token do comprador)
  router.post('/pagamentos', assincrono(async (req, res) => {
    const pagamento = await pagamentoService.registrar({ ...validarRegistro(req.body), comprador: req.usuario });
    res.status(201).json(paraPagamentoResponse(pagamento));
  }));

  // Consultar pagamento do pedido (só comprador ou vendedor)
  router.get('/pagamentos/pedido/:pedidoId', assincrono(async (req, res) => {
    const pagamento = await pagamentoService.buscarPorPedido(validarId(req.params.pedidoId, 'pedidoId'), req.usuario.id);
    res.json(paraPagamentoResponse(pagamento));
  }));

  // Confirmar pagamento (só o vendedor)
  router.patch('/pagamentos/:id/confirmar', assincrono(async (req, res) => {
    res.json(paraPagamentoResponse(await pagamentoService.confirmar(validarId(req.params.id), req.usuario.id)));
  }));

  // Cancelar pagamento (comprador ou vendedor)
  router.patch('/pagamentos/:id/cancelar', assincrono(async (req, res) => {
    res.json(paraPagamentoResponse(await pagamentoService.cancelar(validarId(req.params.id), req.usuario.id)));
  }));

  return router;
}
