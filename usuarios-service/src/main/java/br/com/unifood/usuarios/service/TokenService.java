package br.com.unifood.usuarios.service;

import br.com.unifood.usuarios.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private final SecretKey chave;
    private final Duration validade;

    public TokenService(@Value("${jwt.secret}") String segredo,
                        @Value("${jwt.expiracao-horas}") long horas) {
        this.chave = Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8));
        this.validade = Duration.ofHours(horas);
    }

    public String gerar(Usuario u) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(u.getId())
                .claim("nome", u.getNome())
                .claim("email", u.getEmail())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(validade)))
                .signWith(chave)
                .compact();
    }

    /** Retorna o id do usuário (subject) se o token for válido e não expirado. */
    public Optional<String> validar(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(chave).build().parseSignedClaims(token).getPayload();
            return Optional.of(c.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
