import { StatusPedido, TipoEntrega } from '../domain/StatusPedido.js';
import { RequisicaoInvalidaError } from '../erros.js';

const METODOS_PAGAMENTO = ['PIX', 'DINHEIRO', 'CARTAO'];
const MAX_ITENS = 20;
const MAX_QUANTIDADE = 99;
const MAX_BLOCO = 40;

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

function exigir(problemas) {
  if (problemas.length) throw new RequisicaoInvalidaError(problemas.join('; '));
}

/** Valida o corpo do POST /pedidos e extrai só os campos esperados. Itens repetidos são somados. */
export function validarCriacao(corpo = {}) {
  const problemas = [];

  const quantidades = new Map();
  if (!Array.isArray(corpo.itens) || corpo.itens.length === 0) {
    problemas.push('itens deve ter pelo menos um item');
  } else if (corpo.itens.length > MAX_ITENS) {
    problemas.push(`itens deve ter no máximo ${MAX_ITENS} itens`);
  } else {
    corpo.itens.forEach((item, i) => {
      const produtoId = texto(item?.produtoId);
      const quantidade = item?.quantidade;
      if (!produtoId) problemas.push(`itens[${i}].produtoId não pode estar em branco`);
      if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > MAX_QUANTIDADE) {
        problemas.push(`itens[${i}].quantidade deve ser um inteiro entre 1 e ${MAX_QUANTIDADE}`);
      }
      if (produtoId && Number.isInteger(quantidade)) {
        quantidades.set(produtoId, (quantidades.get(produtoId) ?? 0) + quantidade);
      }
    });
  }

  if (!Object.values(TipoEntrega).includes(corpo.tipoEntrega)) {
    problemas.push(`tipoEntrega deve ser ${Object.values(TipoEntrega).join(' ou ')}`);
  }
  if (!METODOS_PAGAMENTO.includes(corpo.metodoPagamento)) {
    problemas.push(`metodoPagamento deve ser ${METODOS_PAGAMENTO.join(', ')}`);
  }
  const blocoEncontro = texto(corpo.blocoEncontro);
  if (blocoEncontro.length > MAX_BLOCO) problemas.push(`blocoEncontro deve ter no máximo ${MAX_BLOCO} caracteres`);
  if (corpo.tipoEntrega === TipoEntrega.ENTREGA && !blocoEncontro) {
    problemas.push('blocoEncontro é obrigatório para entrega');
  }
  exigir(problemas);

  return {
    itens: [...quantidades].map(([produtoId, quantidade]) => ({ produtoId, quantidade })),
    tipoEntrega: corpo.tipoEntrega,
    // Na retirada o bloco é o do produto: o que o cliente enviar é ignorado (regra no domínio).
    blocoEncontro: corpo.tipoEntrega === TipoEntrega.ENTREGA ? blocoEncontro : null,
    metodoPagamento: corpo.metodoPagamento,
  };
}

export function validarStatus(corpo = {}) {
  if (!Object.values(StatusPedido).includes(corpo.status)) {
    throw new RequisicaoInvalidaError(`status deve ser ${Object.values(StatusPedido).join(', ')}`);
  }
  return corpo.status;
}

export function validarId(valor) {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id < 1) throw new RequisicaoInvalidaError('id do pedido inválido');
  return id;
}
