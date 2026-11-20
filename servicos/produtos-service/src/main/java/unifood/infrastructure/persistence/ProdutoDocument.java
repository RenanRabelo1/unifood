package unifood.infrastructure.persistence;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import unifood.domain.model.Produto;

/** Formato do documento na coleção "produtos" do MongoDB (produtos_db). */
@Document("produtos")
record ProdutoDocument(
        @Id String id,
        String nome,
        String descricao,
        double preco,
        String bloco,
        String imagemUrl,
        boolean disponivel,
        @Indexed String vendedorId,
        String vendedorNome,
        Instant criadoEm) {

    static ProdutoDocument de(Produto p) {
        return new ProdutoDocument(p.getId(), p.getNome(), p.getDescricao(), p.getPreco(), p.getBloco(),
                p.getImagemUrl(), p.isDisponivel(), p.getVendedorId(), p.getVendedorNome(), p.getCriadoEm());
    }

    Produto paraDominio() {
        return new Produto(id, nome, descricao, preco, bloco, imagemUrl, disponivel, vendedorId, vendedorNome, criadoEm);
    }
}
