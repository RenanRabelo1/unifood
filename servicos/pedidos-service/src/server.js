import { criarApp } from './app.js';
import { PedidoService } from './application/PedidoService.js';
import { carregarConfig } from './config/env.js';
import { PagamentosHttpGateway, ProdutosHttpGateway, UsuariosHttpGateway } from './infrastructure/servicosExternos.js';
import { criarPool, garantirBanco, migrar } from './infrastructure/database/pool.js';
import { PedidoRepositoryMysql } from './infrastructure/persistence/PedidoRepositoryMysql.js';

/**
 * Composition root: o ÚNICO lugar que conhece as implementações concretas e as liga às portas (DIP).
 * Trocar MySQL ou o jeito de falar com outro serviço = mudar uma linha aqui, sem tocar nos casos de uso.
 */
const config = carregarConfig();
await garantirBanco(config.banco);
const pool = criarPool(config.banco);
await migrar(pool);

const usuarios = new UsuariosHttpGateway(config.servicos.usuarios);
const pedidoService = new PedidoService({
  repositorio: new PedidoRepositoryMysql(pool),
  produtos: new ProdutosHttpGateway(config.servicos.produtos),
  pagamentos: new PagamentosHttpGateway(config.servicos.pagamentos),
});

const app = criarApp({ pedidoService, usuarios, corsOrigens: config.corsOrigens });

const servidor = app.listen(config.porta, () => {
  console.log(`pedidos-service ouvindo na porta ${config.porta}`);
});

function encerrar() {
  servidor.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);
