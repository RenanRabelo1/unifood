package unifood.application.port;

import java.util.Optional;
import unifood.domain.model.Usuario;

/** Porta de saída para emissão/validação de tokens. Implementação atual: JWT. */
public interface ProvedorToken {
    String gerar(Usuario usuario);

    /** Devolve o id do usuário se o token for válido e não expirado. */
    Optional<String> extrairUsuarioId(String token);
}
