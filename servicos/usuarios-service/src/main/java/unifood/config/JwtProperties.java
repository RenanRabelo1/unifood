package unifood.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Parâmetros do token JWT, lidos de application.properties / variáveis de ambiente. */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(String segredo, long expiracaoHoras) {}
