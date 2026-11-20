package br.com.unifood.produtos.controller;

import br.com.unifood.produtos.client.UsuariosClient;
import br.com.unifood.produtos.client.UsuariosClient.UsuarioLogado;
import br.com.unifood.produtos.dto.ProdutoRequest;
import br.com.unifood.produtos.model.Produto;
import br.com.unifood.produtos.repository.ProdutoRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProdutoController {
    private static final String AUTH = "Authorization";
    private final ProdutoRepository repo;
    private final UsuariosClient usuarios;

    public ProdutoController(ProdutoRepository repo, UsuariosClient usuarios) {
        this.repo = repo;
        this.usuarios = usuarios;
    }

    /** Listar produtos disponíveis (vitrine), com filtro opcional por bloco. Público. */
    @GetMapping("/produtos")
    public List<Produto> listar(@RequestParam(required = false) String bloco) {
        return (bloco == null || bloco.isBlank())
                ? repo.findByDisponivelTrueOrderByCriadoEmDesc()
                : repo.findByDisponivelTrueAndBlocoIgnoreCaseOrderByCriadoEmDesc(bloco.trim());
    }

    /** Listar meus produtos (do vendedor logado), inclusive os indisponíveis. */
    @GetMapping("/produtos/meus")
    public ResponseEntity<?> meus(@RequestHeader(value = AUTH, required = false) String auth) {
        Optional<UsuarioLogado> u = usuarios.validar(auth);
        if (u.isEmpty()) return naoAutorizado();
        return ResponseEntity.ok(repo.findByVendedorIdOrderByCriadoEmDesc(u.get().id()));
    }

    /** Detalhar produto. Também usado pelo serviço de Pedidos para buscar preço, bloco e vendedor. */
    @GetMapping("/produtos/{id}")
    public ResponseEntity<?> detalhar(@PathVariable String id) {
        return repo.findById(id).<ResponseEntity<?>>map(ResponseEntity::ok).orElseGet(this::naoEncontrado);
    }

    /** Cadastrar produto (com bloco de retirada). O vendedor vem do token. */
    @PostMapping("/produtos")
    public ResponseEntity<?> cadastrar(@RequestHeader(value = AUTH, required = false) String auth,
                                       @Valid @RequestBody ProdutoRequest req) {
        Optional<UsuarioLogado> u = usuarios.validar(auth);
        if (u.isEmpty()) return naoAutorizado();
        Produto p = new Produto();
        aplicar(p, req);
        p.setVendedorId(u.get().id());
        p.setVendedorNome(u.get().nome());
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(p));
    }

    /** Editar produto (só o dono). */
    @PutMapping("/produtos/{id}")
    public ResponseEntity<?> editar(@RequestHeader(value = AUTH, required = false) String auth,
                                    @PathVariable String id, @Valid @RequestBody ProdutoRequest req) {
        Optional<UsuarioLogado> u = usuarios.validar(auth);
        if (u.isEmpty()) return naoAutorizado();
        Optional<Produto> p = repo.findById(id);
        if (p.isEmpty()) return naoEncontrado();
        if (!p.get().getVendedorId().equals(u.get().id())) return proibido();
        aplicar(p.get(), req);
        return ResponseEntity.ok(repo.save(p.get()));
    }

    /** Remover produto (só o dono). */
    @DeleteMapping("/produtos/{id}")
    public ResponseEntity<?> remover(@RequestHeader(value = AUTH, required = false) String auth,
                                     @PathVariable String id) {
        Optional<UsuarioLogado> u = usuarios.validar(auth);
        if (u.isEmpty()) return naoAutorizado();
        Optional<Produto> p = repo.findById(id);
        if (p.isEmpty()) return naoEncontrado();
        if (!p.get().getVendedorId().equals(u.get().id())) return proibido();
        repo.delete(p.get());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "servico", "produtos");
    }

    private static void aplicar(Produto p, ProdutoRequest r) {
        p.setNome(r.nome().trim());
        p.setDescricao(r.descricao());
        p.setPreco(r.preco());
        p.setBloco(r.bloco().trim());
        p.setImagemUrl(r.imagemUrl());
        if (r.disponivel() != null) p.setDisponivel(r.disponivel());
    }

    private ResponseEntity<?> naoAutorizado() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("erro", "Token inválido ou ausente"));
    }

    private ResponseEntity<?> proibido() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erro", "Apenas o dono pode alterar este produto"));
    }

    private ResponseEntity<?> naoEncontrado() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", "Produto não encontrado"));
    }
}
