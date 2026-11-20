package unifood.infrastructure.persistence;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

interface UsuarioMongoRepository extends MongoRepository<UsuarioDocument, String> {
    Optional<UsuarioDocument> findByEmail(String email);
    boolean existsByEmail(String email);
}
