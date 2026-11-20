package unifood.api.dto;

import unifood.domain.model.Usuario;

/** Visão pública do usuário: nunca expõe o hash da senha. */
public record UsuarioResponse(String id, String nome, String email, String matricula) {

    public static UsuarioResponse de(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getMatricula());
    }
}
