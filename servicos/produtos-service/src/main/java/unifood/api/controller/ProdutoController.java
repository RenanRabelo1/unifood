package unifood.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import unifood.api.auth.UsuarioLogado;
import unifood.api.dto.ProdutoRequest;
import unifood.api.dto.ProdutoResponse;
import unifood.application.port.AutenticacaoGateway.UsuarioAutenticado;
import unifood.application.service.ProdutoService;

@RestController
@RequestMapping("/produtos")
public class ProdutoController {

    private final ProdutoService produtos;

    public ProdutoController(ProdutoService produtos) {
        this.produtos = produtos;
    }

    /** Listar produtos disponíveis (vitrine), com filtro opcional por bloco. Público. */
    @GetMapping
    public List<ProdutoResponse> listar(@RequestParam(required = false) String bloco) {
        return ProdutoResponse.de(produtos.listarDisponiveis(bloco));
    }

    /** Listar meus produtos (do vendedor logado), inclusive os indisponíveis. */
    @GetMapping("/meus")
    public List<ProdutoResponse> meus(@UsuarioLogado UsuarioAutenticado usuario) {
        return ProdutoResponse.de(produtos.listarDoVendedor(usuario));
    }

    /** Detalhar produto. Também usado pelo serviço de Pedidos para buscar preço, bloco e vendedor. */
    @GetMapping("/{id}")
    public ProdutoResponse detalhar(@PathVariable String id) {
        return ProdutoResponse.de(produtos.detalhar(id));
    }

    /** Cadastrar produto (com bloco de retirada). O vendedor vem do token. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoResponse cadastrar(@UsuarioLogado UsuarioAutenticado usuario, @Valid @RequestBody ProdutoRequest req) {
        return ProdutoResponse.de(produtos.cadastrar(req.paraDominio(), usuario));
    }

    /** Editar produto (só o dono). */
    @PutMapping("/{id}")
    public ProdutoResponse editar(@UsuarioLogado UsuarioAutenticado usuario, @PathVariable String id,
                                  @Valid @RequestBody ProdutoRequest req) {
        return ProdutoResponse.de(produtos.editar(id, req.paraDominio(), usuario));
    }

    /** Remover produto (só o dono). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@UsuarioLogado UsuarioAutenticado usuario, @PathVariable String id) {
        produtos.remover(id, usuario);
    }
}
