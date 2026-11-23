/** Configuração lida das variáveis de ambiente (ponto único; o resto do código não toca em process.env). */

const OBRIGATORIAS_EM_PRODUCAO = ['DATABASE_URL', 'USUARIOS_URL', 'PRODUTOS_URL', 'PAGAMENTOS_URL'];
const semBarraFinal = (url) => url.replace(/\/+$/, '');

export function carregarConfig(env = process.env) {
  if (env.NODE_ENV === 'production') {
    const faltando = OBRIGATORIAS_EM_PRODUCAO.filter((nome) => !env[nome]);
    if (faltando.length) throw new Error(`Variáveis obrigatórias em produção: ${faltando.join(', ')}`);
  }

  return {
    porta: Number(env.PORT) || 3001,
    corsOrigens: (env.CORS_ORIGENS || '*').split(',').map((o) => o.trim()),
    banco: {
      url: env.DATABASE_URL || 'mysql://root:root@localhost:3306/pedidos_db',
      ssl: env.DB_SSL === 'true',
    },
    servicos: {
      usuarios: semBarraFinal(env.USUARIOS_URL || 'http://localhost:8081'),
      produtos: semBarraFinal(env.PRODUTOS_URL || 'http://localhost:8082'),
      pagamentos: semBarraFinal(env.PAGAMENTOS_URL || 'http://localhost:3002'),
    },
  };
}
