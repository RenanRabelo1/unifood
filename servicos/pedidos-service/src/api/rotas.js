import { Router } from 'express';
import { paraPedidoResponse } from './dto.js';
import { autenticar } from './middlewares/autenticar.js';
import { validarCriacao, validarId, validarStatus } from './validadores.js';

/** Express 4 não captura rejeições de handlers async sozinho: este wrapper repassa o erro ao tratador. */
const assincrono = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

/** Controllers: só traduzem HTTP <-> casos de uso. Nenhuma regra de negócio aqui. */
export function criarRotas({ pedidoService, usuarios }) {
  const router = Router();

  router.get('/health', (_req, res) => res.json({ status: 'ok', servico: 'pedidos' }));

  // Todas as rotas abaixo exigem token válido.
  router.use('/pedidos', autenticar(usuarios));

  // Criar pedido (valida, calcula o total e registra o pagamento)
  router.post('/pedidos', assincrono(async (req, res) => {
    const pedido = await pedidoService.criar({
      ...validarCriacao(req.body),
      comprador: req.usuario,
      authorization: req.authorization,
    });
    res.status(201).json(paraPedidoResponse(pedido));
  }));

  // Listar meus pedidos (sou o comprador)
  router.get('/pedidos/meus', assincrono(async (req, res) => {
    res.json((await pedidoService.listarMeus(req.usuario.id)).map(paraPedidoResponse));
  }));

  // Listar pedidos recebidos (sou o vendedor)
  router.get('/pedidos/recebidos', assincrono(async (req, res) => {
    res.json((await pedidoService.listarRecebidos(req.usuario.id)).map(paraPedidoResponse));
  }));

  // Detalhar pedido (só comprador ou vendedor)
  router.get('/pedidos/:id', assincrono(async (req, res) => {
    res.json(paraPedidoResponse(await pedidoService.buscar(validarId(req.params.id), req.usuario.id)));
  }));

  // Alterar status do pedido
  router.patch('/pedidos/:id/status', assincrono(async (req, res) => {
    const pedido = await pedidoService.alterarStatus(
      validarId(req.params.id), validarStatus(req.body), req.usuario.id,
    );
    res.json(paraPedidoResponse(pedido));
  }));

  return router;
}
