package unifood.infrastructure.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import unifood.application.exception.NaoAutenticadoException;
import unifood.application.exception.ServicoIndisponivelException;
import unifood.application.port.AutenticacaoGateway;

/** Comunicação síncrona (HTTP/REST) com o microserviço de Usuários: GET /auth/validar. */
@Component
class UsuariosHttpGateway implements AutenticacaoGateway {

    private final RestClient http;

    UsuariosHttpGateway(@Value("${usuarios.url}") String baseUrl) {
        this.http = RestClient.builder().baseUrl(baseUrl).build();
    }

    @Override
    public UsuarioAutenticado autenticar(String headerAuthorization) {
        if (headerAuthorization == null || !headerAuthorization.startsWith("Bearer ")) {
            throw new NaoAutenticadoException();
        }
        try {
            return http.get().uri("/auth/validar")
                    .header(HttpHeaders.AUTHORIZATION, headerAuthorization)
                    .retrieve()
                    .body(UsuarioAutenticado.class);
        } catch (HttpClientErrorException e) {
            throw new NaoAutenticadoException();
        } catch (RestClientException e) {
            throw new ServicoIndisponivelException("usuários");
        }
    }
}
