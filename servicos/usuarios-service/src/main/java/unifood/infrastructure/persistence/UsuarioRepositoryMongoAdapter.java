package unifood.infrastructure.persistence;

import java.util.Optional;
import org.springframework.stereotype.Repository;
import unifood.application.port.UsuarioRepository;
import unifood.domain.model.Usuario;

/** Adaptador (GRASP Indirection / Pure Fabrication) entre a porta da aplicação e o Spring Data MongoDB. */
@Repository
class UsuarioRepositoryMongoAdapter implements UsuarioRepository {

    private final UsuarioMongoRepository mongo;

    UsuarioRepositoryMongoAdapter(UsuarioMongoRepository mongo) {
        this.mongo = mongo;
    }

    @Override
    public Usuario salvar(Usuario usuario) {
        return mongo.save(UsuarioDocument.de(usuario)).paraDominio();
    }

    @Override
    public Optional<Usuario> buscarPorId(String id) {
        return mongo.findById(id).map(UsuarioDocument::paraDominio);
    }

    @Override
    public Optional<Usuario> buscarPorEmail(String email) {
        return mongo.findByEmail(email).map(UsuarioDocument::paraDominio);
    }

    @Override
    public boolean existePorEmail(String email) {
        return mongo.existsByEmail(email);
    }
}
