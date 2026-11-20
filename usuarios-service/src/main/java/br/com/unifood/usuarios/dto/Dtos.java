package br.com.unifood.usuarios.dto;

import br.com.unifood.usuarios.model.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class Dtos {
    private Dtos() {}

    public record CadastroRequest(
            @NotBlank String nome,
            @NotBlank @Email String email,
            String matricula,
            @NotBlank @Size(min = 6, message = "deve ter pelo menos 6 caracteres") String senha) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String senha) {}

    /** Visão pública do usuário: nunca expõe o hash da senha. */
    public record UsuarioResponse(String id, String nome, String email, String matricula) {
        public static UsuarioResponse of(Usuario u) {
            return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getMatricula());
        }
    }

    public record LoginResponse(String token, UsuarioResponse usuario) {}
}
