package unifood.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import unifood.domain.model.DadosProduto;

public record ProdutoRequest(
        @NotBlank String nome,
        String descricao,
        @Positive double preco,
        @NotBlank String bloco,
        String imagemUrl,
        Boolean disponivel) {

    public DadosProduto paraDominio() {
        return new DadosProduto(nome, descricao, preco, bloco, imagemUrl, disponivel);
    }
}
