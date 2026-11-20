package unifood.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CadastroUsuarioRequest(
        @NotBlank String nome,
        @NotBlank @Email String email,
        String matricula,
        @NotBlank @Size(min = 6, message = "deve ter pelo menos 6 caracteres") String senha) {}
