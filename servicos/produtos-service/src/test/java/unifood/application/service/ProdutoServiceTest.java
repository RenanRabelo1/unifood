package unifood.application.service;

import static org.junit.jupiter.api.Assertions.*;

import java.util.*;
import org.junit.jupiter.api.Test;
import unifood.application.port.AutenticacaoGateway.UsuarioAutenticado;
import unifood.application.port.ProdutoRepository;
import unifood.domain.exception.AcessoNegadoException;
import unifood.domain.exception.ProdutoNaoEncontradoException;
import unifood.domain.model.DadosProduto;
import unifood.domain.model.Produto;

class ProdutoServiceTest {

    /** Repositório em memória: só é possível porque o serviço depende da interface (DIP). */
    static class RepositorioEmMemoria implements ProdutoRepository {
        final Map<String, Produto> dados = new LinkedHashMap<>();

        public Produto salvar(Produto p) {
            String id = p.getId() != null ? p.getId() : UUID.randomUUID().toString();
            Produto salvo = new Produto(id, p.getNome(), p.getDescricao(), p.getPreco(), p.getBloco(), p.getImagemUrl(),
                    p.isDisponivel(), p.getVendedorId(), p.getVendedorNome(), p.getCriadoEm());
            dados.put(id, salvo);
            return salvo;
        }
        public Optional<Produto> buscarPorId(String id) { return Optional.ofNullable(dados.get(id)); }
        public List<Produto> listarDisponiveis() { return dados.values().stream().filter(Produto::isDisponivel).toList(); }
        public List<Produto> listarDisponiveisPorBloco(String b) {
            return listarDisponiveis().stream().filter(p -> p.getBloco().equalsIgnoreCase(b)).toList();
        }
        public List<Produto> listarPorVendedor(String v) { return dados.values().stream().filter(p -> p.pertenceA(v)).toList(); }
        public void remover(Produto p) { dados.remove(p.getId()); }
    }

    private final RepositorioEmMemoria repo = new RepositorioEmMemoria();
    private final ProdutoService service = new ProdutoService(repo);
    private final UsuarioAutenticado ana = new UsuarioAutenticado("ana", "Ana", "ana@uni.br");
    private final UsuarioAutenticado bruno = new UsuarioAutenticado("bruno", "Bruno", "bruno@uni.br");
    private final DadosProduto dados = new DadosProduto("Brigadeiro", null, 3.5, "Bloco A", null, null);

    @Test
    void cadastroVinculaOVendedorDoToken() {
        Produto p = service.cadastrar(dados, ana);
        assertEquals("ana", p.getVendedorId());
        assertEquals("Ana", p.getVendedorNome());
    }

    @Test
    void outroUsuarioNaoEditaNemRemove() {
        String id = service.cadastrar(dados, ana).getId();
        assertThrows(AcessoNegadoException.class, () -> service.editar(id, dados, bruno));
        assertThrows(AcessoNegadoException.class, () -> service.remover(id, bruno));
    }

    @Test
    void filtroPorBlocoIgnoraMaiusculas() {
        service.cadastrar(dados, ana);
        assertEquals(1, service.listarDisponiveis("bloco a").size());
        assertEquals(0, service.listarDisponiveis("Bloco B").size());
    }

    @Test
    void produtoRemovidoNaoEhMaisEncontrado() {
        String id = service.cadastrar(dados, ana).getId();
        service.remover(id, ana);
        assertThrows(ProdutoNaoEncontradoException.class, () -> service.detalhar(id));
    }
}
