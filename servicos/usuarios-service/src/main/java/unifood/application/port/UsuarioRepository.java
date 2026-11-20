package unifood.application.port;

import java.util.Optional;
import unifood.domain.model.Usuario;

/** Porta de saída (DIP): a aplicação depende desta interface, não do MongoDB. */
public interface UsuarioRepository {
    Usuario salvar(Usuario usuario);
    Optional<Usuario> buscarPorId(String id);
    Optional<Usuario> buscarPorEmail(String email);
    boolean existePorEmail(String email);
}
