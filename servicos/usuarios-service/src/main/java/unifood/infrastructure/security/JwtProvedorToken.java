package unifood.infrastructure.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;
import unifood.application.port.ProvedorToken;
import unifood.config.JwtProperties;
import unifood.domain.model.Usuario;

@Component
class JwtProvedorToken implements ProvedorToken {

    private final SecretKey chave;
    private final Duration validade;

    JwtProvedorToken(JwtProperties props) {
        this.chave = Keys.hmacShaKeyFor(props.segredo().getBytes(StandardCharsets.UTF_8));
        this.validade = Duration.ofHours(props.expiracaoHoras());
    }

    @Override
    public String gerar(Usuario usuario) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(usuario.getId())
                .claim("nome", usuario.getNome())
                .claim("email", usuario.getEmail())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(validade)))
                .signWith(chave)
                .compact();
    }

    @Override
    public Optional<String> extrairUsuarioId(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(chave).build()
                    .parseSignedClaims(token).getPayload().getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
