import { MetodoPagamento } from '../domain/StatusPagamento.js';
import { RequisicaoInvalidaError } from '../erros.js';

const VALOR_MAXIMO = 99_999_999.99; // limite da coluna DECIMAL(10,2)
const MAX_ID_VENDEDOR = 64;

function exigir(problemas) {
  if (problemas.length) throw new RequisicaoInvalidaError(problemas.join('; '));
}

/** Valida o corpo do POST /pagamentos e extrai só os campos esperados. */
export function validarRegistro(corpo = {}) {
  const problemas = [];
  const { pedidoId, valor, metodo } = corpo;
  const vendedorId = typeof corpo.vendedorId === 'string' ? corpo.vendedorId.trim() : '';

  if (!Number.isSafeInteger(pedidoId) || pedidoId < 1) problemas.push('pedidoId deve ser um inteiro positivo');
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor > VALOR_MAXIMO) {
    problemas.push('valor deve ser um número maior que zero');
  } else if (Math.round(valor * 100) / 100 !== valor) {
    problemas.push('valor deve ter no máximo 2 casas decimais');
  }
  if (!Object.values(MetodoPagamento).includes(metodo)) {
    problemas.push(`metodo deve ser ${Object.values(MetodoPagamento).join(', ')}`);
  }
  if (!vendedorId) problemas.push('vendedorId não pode estar em branco');
  else if (vendedorId.length > MAX_ID_VENDEDOR) problemas.push(`vendedorId deve ter no máximo ${MAX_ID_VENDEDOR} caracteres`);
  exigir(problemas);

  return { pedidoId, valor, metodo, vendedorId };
}

/** Valida ids que vêm na URL (id do pagamento ou do pedido). */
export function validarId(valor, nome = 'id') {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id < 1) throw new RequisicaoInvalidaError(`${nome} inválido`);
  return id;
}
