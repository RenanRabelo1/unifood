import { criarApp } from './app.js';
import { PagamentoService } from './application/PagamentoService.js';
import { carregarConfig } from './config/env.js';
import { UsuariosHttpGateway } from './infrastructure/servicosExternos.js';
import { criarPool, garantirBanco, migrar } from './infrastructure/database/pool.js';
import { PagamentoRepositoryMysql } from './infrastructure/persistence/PagamentoRepositoryMysql.js';

/**
 * Composition root: o ÚNICO lugar que conhece as implementações concretas e as liga às portas (DIP).
 * Trocar o MySQL, ou trocar o pagamento simulado por um gateway real, = mudar uma linha aqui.
 */
const config = carregarConfig();
await garantirBanco(config.banco);
const pool = criarPool(config.banco);
await migrar(pool);

const usuarios = new UsuariosHttpGateway(config.servicos.usuarios);
const pagamentoService = new PagamentoService({ repositorio: new PagamentoRepositoryMysql(pool) });

const app = criarApp({ pagamentoService, usuarios, corsOrigens: config.corsOrigens });

const servidor = app.listen(config.porta, () => {
  console.log(`pagamentos-service ouvindo na porta ${config.porta}`);
});

function encerrar() {
  servidor.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);
