package unifood.application.port;

import unifood.domain.model.Usuario;

/** Porta de saída para hash de senha. Implementação atual: BCrypt. */
public interface CodificadorSenha extends Usuario.SenhaConferidor {
    String gerarHash(String senha);
}
