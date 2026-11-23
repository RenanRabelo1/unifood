import { TokenInvalidoError } from '../../erros.js';

const PREFIXO_BEARER = 'Bearer ';

/**
 * Autentica a requisição perguntando ao serviço de Usuários quem é o dono do token.
 * Deixa o usuário em `req.usuario` e o header original em `req.authorization` (repassado ao serviço de Pagamentos).
 * @param usuarios porta UsuariosGateway
 */
export function autenticar(usuarios) {
  return async (req, _res, next) => {
    try {
      const authorization = req.get('Authorization');
      if (!authorization?.startsWith(PREFIXO_BEARER)) throw new TokenInvalidoError();
      const usuario = await usuarios.validarToken(authorization);
      if (!usuario) throw new TokenInvalidoError();
      req.usuario = usuario;
      req.authorization = authorization;
      next();
    } catch (erro) {
      next(erro);
    }
  };
}
