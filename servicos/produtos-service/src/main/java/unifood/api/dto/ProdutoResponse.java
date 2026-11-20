package unifood.api.dto;

import java.time.Instant;
import java.util.List;
import unifood.domain.model.Produto;

/** Formato público do produto. Pedidos usa preco, bloco e vendedorId. */
public record ProdutoResponse(String id, String nome, String descricao, double preco, String bloco, String imagemUrl,
                              boolean disponivel, String vendedorId, String vendedorNome, Instant criadoEm) {

    public static ProdutoResponse de(Produto p) {
        return new ProdutoResponse(p.getId(), p.getNome(), p.getDescricao(), p.getPreco(), p.getBloco(),
                p.getImagemUrl(), p.isDisponivel(), p.getVendedorId(), p.getVendedorNome(), p.getCriadoEm());
    }

    public static List<ProdutoResponse> de(List<Produto> produtos) {
        return produtos.stream().map(ProdutoResponse::de).toList();
    }
}
