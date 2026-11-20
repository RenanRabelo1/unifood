package br.com.unifood.produtos.client;

import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Comunicação síncrona (HTTP) com o microserviço de Usuários. */
@Component
public class UsuariosClient {
    public record UsuarioLogado(String id, String nome, String email) {}

    private final RestClient http;

    public UsuariosClient(@Value("${usuarios.url}") String baseUrl) {
        this.http = RestClient.builder().baseUrl(baseUrl).build();
    }

    /** Pergunta ao serviço de Usuários se o token é válido e quem é o vendedor. */
    public Optional<UsuarioLogado> validar(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return Optional.empty();
        try {
            return Optional.ofNullable(http.get().uri("/auth/validar")
                    .header("Authorization", authorization)
                    .retrieve()
                    .body(UsuarioLogado.class));
        } catch (RestClientException e) {
            return Optional.empty();
        }
    }
}
