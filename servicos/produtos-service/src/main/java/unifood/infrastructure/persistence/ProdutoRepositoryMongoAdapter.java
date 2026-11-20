package unifood.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import unifood.application.port.ProdutoRepository;
import unifood.domain.model.Produto;

/** Adaptador (GRASP Indirection / Pure Fabrication) entre a porta da aplicação e o Spring Data MongoDB. */
@Repository
class ProdutoRepositoryMongoAdapter implements ProdutoRepository {

    private final ProdutoMongoRepository mongo;

    ProdutoRepositoryMongoAdapter(ProdutoMongoRepository mongo) {
        this.mongo = mongo;
    }

    @Override
    public Produto salvar(Produto produto) {
        return mongo.save(ProdutoDocument.de(produto)).paraDominio();
    }

    @Override
    public Optional<Produto> buscarPorId(String id) {
        return mongo.findById(id).map(ProdutoDocument::paraDominio);
    }

    @Override
    public List<Produto> listarDisponiveis() {
        return paraDominio(mongo.findByDisponivelTrueOrderByCriadoEmDesc());
    }

    @Override
    public List<Produto> listarDisponiveisPorBloco(String bloco) {
        return paraDominio(mongo.findByDisponivelTrueAndBlocoIgnoreCaseOrderByCriadoEmDesc(bloco));
    }

    @Override
    public List<Produto> listarPorVendedor(String vendedorId) {
        return paraDominio(mongo.findByVendedorIdOrderByCriadoEmDesc(vendedorId));
    }

    @Override
    public void remover(Produto produto) {
        mongo.deleteById(produto.getId());
    }

    private static List<Produto> paraDominio(List<ProdutoDocument> docs) {
        return docs.stream().map(ProdutoDocument::paraDominio).toList();
    }
}
