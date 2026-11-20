package unifood.application.port;

import java.util.List;
import java.util.Optional;
import unifood.domain.model.Produto;

/** Porta de saída (DIP): a aplicação depende desta interface, não do MongoDB. */
public interface ProdutoRepository {
    Produto salvar(Produto produto);
    Optional<Produto> buscarPorId(String id);
    List<Produto> listarDisponiveis();
    List<Produto> listarDisponiveisPorBloco(String bloco);
    List<Produto> listarPorVendedor(String vendedorId);
    void remover(Produto produto);
}
