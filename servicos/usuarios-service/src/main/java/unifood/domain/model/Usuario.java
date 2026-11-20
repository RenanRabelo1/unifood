package unifood.domain.model;

import java.time.Instant;
import java.util.Objects;

/**
 * Entidade de domínio. Não conhece Spring, MongoDB nem HTTP.
 * GRASP Information Expert: é o Usuario que sabe normalizar seu e-mail e conferir sua senha.
 */
public class Usuario {

    private final String id;
    private final String nome;
    private final String email;
    private final String matricula;
    private final String senhaHash;
    private final Instant criadoEm;

    public Usuario(String id, String nome, String email, String matricula, String senhaHash, Instant criadoEm) {
        this.id = id;
        this.nome = Objects.requireNonNull(nome).trim();
        this.email = normalizarEmail(email);
        this.matricula = matricula;
        this.senhaHash = Objects.requireNonNull(senhaHash);
        this.criadoEm = criadoEm;
    }

    /** GRASP Creator: a própria classe sabe montar um usuário novo, ainda sem id. */
    public static Usuario novo(String nome, String email, String matricula, String senhaHash) {
        return new Usuario(null, nome, email, matricula, senhaHash, Instant.now());
    }

    public static String normalizarEmail(String email) {
        return Objects.requireNonNull(email).trim().toLowerCase();
    }

    public boolean senhaConfere(String senhaDigitada, SenhaConferidor conferidor) {
        return conferidor.confere(senhaDigitada, senhaHash);
    }

    /** Abstração mínima para o domínio conferir senha sem depender de BCrypt (DIP). */
    @FunctionalInterface
    public interface SenhaConferidor {
        boolean confere(String senhaDigitada, String hash);
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getMatricula() { return matricula; }
    public String getSenhaHash() { return senhaHash; }
    public Instant getCriadoEm() { return criadoEm; }
}
