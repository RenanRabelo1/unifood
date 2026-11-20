package br.com.unifood.produtos.repository;

import br.com.unifood.produtos.model.Produto;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProdutoRepository extends MongoRepository<Produto, String> {
    List<Produto> findByDisponivelTrueOrderByCriadoEmDesc();
    List<Produto> findByDisponivelTrueAndBlocoIgnoreCaseOrderByCriadoEmDesc(String bloco);
    List<Produto> findByVendedorIdOrderByCriadoEmDesc(String vendedorId);
}
