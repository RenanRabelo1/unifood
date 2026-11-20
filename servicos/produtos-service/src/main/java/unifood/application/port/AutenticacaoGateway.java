package unifood.application.port;

/** Porta de saída para o microserviço de Usuários: quem é o dono deste token? */
public interface AutenticacaoGateway {

    record UsuarioAutenticado(String id, String nome, String email) {}

    /** @throws unifood.application.exception.NaoAutenticadoException se o token for inválido */
    UsuarioAutenticado autenticar(String headerAuthorization);
}
