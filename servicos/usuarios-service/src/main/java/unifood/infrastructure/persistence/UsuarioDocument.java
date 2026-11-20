package unifood.infrastructure.persistence;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import unifood.domain.model.Usuario;

/** Formato do documento na coleção "usuarios" do MongoDB (usuarios_db). */
@Document("usuarios")
record UsuarioDocument(
        @Id String id,
        String nome,
        @Indexed(unique = true) String email,
        String matricula,
        String senhaHash,
        Instant criadoEm) {

    static UsuarioDocument de(Usuario u) {
        return new UsuarioDocument(u.getId(), u.getNome(), u.getEmail(), u.getMatricula(), u.getSenhaHash(), u.getCriadoEm());
    }

    Usuario paraDominio() {
        return new Usuario(id, nome, email, matricula, senhaHash, criadoEm);
    }
}
