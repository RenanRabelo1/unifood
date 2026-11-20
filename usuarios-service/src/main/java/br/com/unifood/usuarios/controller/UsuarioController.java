package br.com.unifood.usuarios.controller;

import br.com.unifood.usuarios.dto.Dtos.*;
import br.com.unifood.usuarios.model.Usuario;
import br.com.unifood.usuarios.repository.UsuarioRepository;
import br.com.unifood.usuarios.service.TokenService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
public class UsuarioController {
    private final UsuarioRepository repo;
    private final BCryptPasswordEncoder encoder;
    private final TokenService tokens;

    public UsuarioController(UsuarioRepository repo, BCryptPasswordEncoder encoder, TokenService tokens) {
        this.repo = repo;
        this.encoder = encoder;
        this.tokens = tokens;
    }

    /** Cadastrar aluno. */
    @PostMapping("/usuarios")
    public ResponseEntity<?> cadastrar(@Valid @RequestBody CadastroRequest req) {
        String email = req.email().trim().toLowerCase();
        if (repo.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erro", "E-mail já cadastrado"));
        }
        Usuario u = new Usuario();
        u.setNome(req.nome().trim());
        u.setEmail(email);
        u.setMatricula(req.matricula());
        u.setSenhaHash(encoder.encode(req.senha()));
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponse.of(repo.save(u)));
    }

    /** Login: devolve um token JWT usado por todos os outros serviços. */
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return repo.findByEmail(req.email().trim().toLowerCase())
                .filter(u -> encoder.matches(req.senha(), u.getSenhaHash()))
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(new LoginResponse(tokens.gerar(u), UsuarioResponse.of(u))))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("erro", "E-mail ou senha inválidos")));
    }

    /** Validar token: chamado por Produtos, Pedidos e Pagamentos. Devolve quem é o dono do token. */
    @GetMapping("/auth/validar")
    public ResponseEntity<?> validar(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("erro", "Token ausente"));
        }
        return tokens.validar(auth.substring(7))
                .flatMap(repo::findById)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(UsuarioResponse.of(u)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("erro", "Token inválido ou expirado")));
    }

    /** Consultar usuário por id (ex.: nome do vendedor ou do comprador). */
    @GetMapping("/usuarios/{id}")
    public ResponseEntity<?> buscar(@PathVariable String id) {
        return repo.findById(id)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(UsuarioResponse.of(u)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", "Usuário não encontrado")));
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "servico", "usuarios");
    }
}
