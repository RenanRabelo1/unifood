package unifood.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import unifood.api.dto.LoginRequest;
import unifood.api.dto.LoginResponse;
import unifood.api.dto.UsuarioResponse;
import unifood.application.exception.TokenInvalidoException;
import unifood.application.service.AutenticacaoService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final String PREFIXO_BEARER = "Bearer ";

    private final AutenticacaoService autenticacao;

    public AuthController(AutenticacaoService autenticacao) {
        this.autenticacao = autenticacao;
    }

    /** Login: devolve o token JWT usado por todos os outros serviços. */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return LoginResponse.de(autenticacao.login(req.email(), req.senha()));
    }

    /** Validar token: chamado por Produtos, Pedidos e Pagamentos para saber quem é o usuário. */
    @GetMapping("/validar")
    public UsuarioResponse validar(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String header) {
        if (header == null || !header.startsWith(PREFIXO_BEARER)) {
            throw new TokenInvalidoException();
        }
        return UsuarioResponse.de(autenticacao.validar(header.substring(PREFIXO_BEARER.length())));
    }
}
