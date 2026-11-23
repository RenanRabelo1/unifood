import {
  AcessoNegadoError,
  PagamentoInvalidoError,
  PagamentoJaExisteError,
  PagamentoNaoEncontradoError,
  RequisicaoInvalidaError,
  ServicoIndisponivelError,
  TokenInvalidoError,
  TransicaoInvalidaError,
} from '../../erros.js';

/** Mapa único erro -> status HTTP. Os controllers só tratam o caminho feliz. */
const STATUS_POR_ERRO = new Map([
  [RequisicaoInvalidaError, 400],
  [PagamentoInvalidoError, 400],
  [TokenInvalidoError, 401],
  [AcessoNegadoError, 403],
  [PagamentoNaoEncontradoError, 404],
  [PagamentoJaExisteError, 409],
  [TransicaoInvalidaError, 409],
  [ServicoIndisponivelError, 503],
]);

export function rotaNaoEncontrada(_req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

// O Express só reconhece um tratador de erros se ele declarar os 4 parâmetros.
// eslint-disable-next-line no-unused-vars
export function tratadorErros(erro, _req, res, _next) {
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }
  const status = STATUS_POR_ERRO.get(erro.constructor);
  if (status) return res.status(status).json({ erro: erro.message });

  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}
