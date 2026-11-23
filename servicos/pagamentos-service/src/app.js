import cors from 'cors';
import express from 'express';
import { rotaNaoEncontrada, tratadorErros } from './api/middlewares/tratadorErros.js';
import { criarRotas } from './api/rotas.js';

/** Monta o app Express a partir dos casos de uso já criados (facilita testar sem banco e sem rede). */
export function criarApp({ pagamentoService, usuarios, corsOrigens = ['*'] }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigens.includes('*') ? '*' : corsOrigens }));
  app.use(express.json({ limit: '10kb' }));
  app.use(criarRotas({ pagamentoService, usuarios }));
  app.use(rotaNaoEncontrada);
  app.use(tratadorErros);
  return app;
}
