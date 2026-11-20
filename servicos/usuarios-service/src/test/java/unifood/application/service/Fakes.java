package unifood.application.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import unifood.application.port.CodificadorSenha;
import unifood.application.port.ProvedorToken;
import unifood.application.port.UsuarioRepository;
import unifood.domain.model.Usuario;

/** Implementações em memória das portas: só possíveis porque os serviços dependem de interfaces (DIP). */
final class Fakes {
    private Fakes() {}

    static class RepositorioEmMemoria implements UsuarioRepository {
        final Map<String, Usuario> dados = new HashMap<>();

        public Usuario salvar(Usuario u) {
            String id = u.getId() != null ? u.getId() : UUID.randomUUID().toString();
            Usuario salvo = new Usuario(id, u.getNome(), u.getEmail(), u.getMatricula(), u.getSenhaHash(), u.getCriadoEm());
            dados.put(id, salvo);
            return salvo;
        }
        public Optional<Usuario> buscarPorId(String id) { return Optional.ofNullable(dados.get(id)); }
        public Optional<Usuario> buscarPorEmail(String email) {
            return dados.values().stream().filter(u -> u.getEmail().equals(email)).findFirst();
        }
        public boolean existePorEmail(String email) { return buscarPorEmail(email).isPresent(); }
    }

    static class CodificadorReverso implements CodificadorSenha {
        public String gerarHash(String senha) { return new StringBuilder(senha).reverse().toString(); }
        public boolean confere(String senha, String hash) { return gerarHash(senha).equals(hash); }
    }

    static class TokenSimples implements ProvedorToken {
        public String gerar(Usuario u) { return "token-" + u.getId(); }
        public Optional<String> extrairUsuarioId(String t) {
            return t.startsWith("token-") ? Optional.of(t.substring(6)) : Optional.empty();
        }
    }
}
