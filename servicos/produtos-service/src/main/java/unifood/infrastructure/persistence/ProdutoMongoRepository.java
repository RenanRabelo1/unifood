package unifood.infrastructure.persistence;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

interface ProdutoMongoRepository extends MongoRepository<ProdutoDocument, String> {
    List<ProdutoDocument> findByDisponivelTrueOrderByCriadoEmDesc();
    List<ProdutoDocument> findByDisponivelTrueAndBlocoIgnoreCaseOrderByCriadoEmDesc(String bloco);
    List<ProdutoDocument> findByVendedorIdOrderByCriadoEmDesc(String vendedorId);
}
