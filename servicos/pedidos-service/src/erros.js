/**
 * Todos os erros do serviço num só lugar.
 * O domínio não conhece HTTP: quem traduz cada erro para um status é api/middlewares/tratadorErros.js.
 */


// ===== Regras de negócio (domain) =====
/** Violações de regra de negócio. O domínio não sabe nada de HTTP: quem traduz para status é a camada api. */

export class DomainError extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = this.constructor.name;
  }
}

export class PedidoInvalidoError extends DomainError {}

export class PedidoNaoEncontradoError extends DomainError {
  constructor() {
    super('Pedido não encontrado');
  }
}

export class AcessoNegadoError extends DomainError {
  constructor(mensagem = 'Você não tem permissão para acessar este pedido') {
    super(mensagem);
  }
}

export class TransicaoInvalidaError extends DomainError {}


// ===== Autenticação e comunicação entre serviços (application) =====
/** Falhas de aplicação (autenticação e comunicação entre serviços). Sem nenhuma referência a HTTP do cliente. */

export class TokenInvalidoError extends Error {
  constructor() {
    super('Token inválido ou expirado');
    this.name = 'TokenInvalidoError';
  }
}

export class ServicoIndisponivelError extends Error {
  constructor(servico) {
    super(`Serviço de ${servico} indisponível`);
    this.name = 'ServicoIndisponivelError';
    this.servico = servico;
  }
}


// ===== Requisição HTTP malformada (api) =====
/** Requisição malformada (campo faltando, formato inválido). Erro da camada HTTP, por isso fica em api/. */
export class RequisicaoInvalidaError extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'RequisicaoInvalidaError';
  }
}
