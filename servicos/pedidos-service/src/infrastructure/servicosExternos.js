import { ServicoIndisponivelError } from '../erros.js';

// Comunicação síncrona (HTTP/REST) com os outros microsserviços.
// Cada gateway implementa um contrato (porta) descrito em application/PedidoService.js.

// Serviços em plano gratuito "dormem" e levam um tempo para acordar na primeira chamada.
const TIMEOUT_PADRAO_MS = 15_000;

/**
 * Chamada HTTP a outro microsserviço. Falha de rede ou timeout vira ServicoIndisponivelError;
 * qualquer resposta HTTP (inclusive 4xx/5xx) é devolvida para quem chamou decidir o que significa.
 */
export async function chamarServico(nomeServico, url, { method = 'GET', headers = {}, corpo, timeoutMs = TIMEOUT_PADRAO_MS } = {}) {
  let resposta;
  try {
    resposta = await fetch(url, {
      method,
      headers: { ...(corpo !== undefined && { 'Content-Type': 'application/json' }), ...headers },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (erro) {
    console.error(`Falha ao chamar ${nomeServico} (${method} ${url}): ${erro.message}`);
    throw new ServicoIndisponivelError(nomeServico);
  }
  const dados = await resposta.json().catch(() => null);
  return { status: resposta.status, ok: resposta.ok, dados };
}

/**
 * Comunicação síncrona (HTTP/REST) com o serviço de Pagamentos: POST /pagamentos.
 * Repassa o token do comprador, como o contrato em docs/API.md define.
 * @implements {import('../application/PedidoService.js').PagamentosGateway}
 */
export class PagamentosHttpGateway {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async registrar({ pedidoId, valor, metodo, vendedorId }, authorization) {
    const { ok, status } = await chamarServico('pagamentos', `${this.baseUrl}/pagamentos`, {
      method: 'POST',
      headers: { Authorization: authorization },
      corpo: { pedidoId, valor, metodo, vendedorId },
    });
    if (!ok) {
      console.error(`Pagamentos recusou o registro do pedido ${pedidoId} (HTTP ${status})`);
      throw new ServicoIndisponivelError('pagamentos');
    }
  }
}

/**
 * Comunicação síncrona (HTTP/REST) com o serviço de Produtos: GET /produtos/:id (rota pública).
 * @implements {import('../application/PedidoService.js').ProdutosGateway}
 */
export class ProdutosHttpGateway {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async buscarPorId(id) {
    const { status, ok, dados } = await chamarServico('produtos', `${this.baseUrl}/produtos/${encodeURIComponent(id)}`);
    if (ok) {
      return {
        id: String(dados.id),
        nome: dados.nome,
        preco: Number(dados.preco),
        bloco: dados.bloco,
        disponivel: dados.disponivel !== false,
        vendedorId: String(dados.vendedorId),
        vendedorNome: dados.vendedorNome,
      };
    }
    // 404 = não existe; 400 = id em formato que o serviço de Produtos nem aceita. Nos dois casos, produto inválido.
    if (status === 404 || status === 400) return null;
    throw new ServicoIndisponivelError('produtos');
  }
}

/**
 * Comunicação síncrona (HTTP/REST) com o serviço de Usuários: GET /auth/validar.
 * @implements {import('../application/PedidoService.js').UsuariosGateway}
 */
export class UsuariosHttpGateway {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async validarToken(authorization) {
    const { status, ok, dados } = await chamarServico('usuários', `${this.baseUrl}/auth/validar`, {
      headers: { Authorization: authorization },
    });
    if (ok) return { id: String(dados.id), nome: dados.nome };
    if (status === 401 || status === 403) return null;
    throw new ServicoIndisponivelError('usuários');
  }
}
