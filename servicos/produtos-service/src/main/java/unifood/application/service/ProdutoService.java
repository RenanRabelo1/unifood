package unifood.application.service;

import java.util.List;
import org.springframework.stereotype.Service;
import unifood.application.port.AutenticacaoGateway.UsuarioAutenticado;
import unifood.application.port.ProdutoRepository;
import unifood.domain.exception.ProdutoNaoEncontradoException;
import unifood.domain.model.DadosProduto;
import unifood.domain.model.Produto;

/**
 * Casos de uso de produtos.
 * GRASP Controller: orquestra o fluxo; a regra "só o dono altera" fica no próprio Produto.
 */
@Service
public class ProdutoService {

    private final ProdutoRepository repositorio;

    public ProdutoService(ProdutoRepository repositorio) {
        this.repositorio = repositorio;
    }

    public List<Produto> listarDisponiveis(String bloco) {
        return (bloco == null || bloco.isBlank())
                ? repositorio.listarDisponiveis()
                : repositorio.listarDisponiveisPorBloco(bloco.trim());
    }

    public Produto detalhar(String id) {
        return repositorio.buscarPorId(id).orElseThrow(ProdutoNaoEncontradoException::new);
    }

    public List<Produto> listarDoVendedor(UsuarioAutenticado vendedor) {
        return repositorio.listarPorVendedor(vendedor.id());
    }

    public Produto cadastrar(DadosProduto dados, UsuarioAutenticado vendedor) {
        return repositorio.salvar(Produto.novo(dados, vendedor.id(), vendedor.nome()));
    }

    public Produto editar(String id, DadosProduto dados, UsuarioAutenticado usuario) {
        Produto produto = detalhar(id);
        produto.garantirDono(usuario.id());
        produto.atualizar(dados);
        return repositorio.salvar(produto);
    }

    public void remover(String id, UsuarioAutenticado usuario) {
        Produto produto = detalhar(id);
        produto.garantirDono(usuario.id());
        repositorio.remover(produto);
    }
}
