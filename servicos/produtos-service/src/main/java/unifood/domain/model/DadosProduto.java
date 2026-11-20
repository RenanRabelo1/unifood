package unifood.domain.model;

/** Value Object com os campos editáveis de um produto. */
public record DadosProduto(String nome, String descricao, double preco, String bloco, String imagemUrl, Boolean disponivel) {

    public DadosProduto {
        if (nome == null || nome.isBlank()) throw new IllegalArgumentException("nome é obrigatório");
        if (bloco == null || bloco.isBlank()) throw new IllegalArgumentException("bloco é obrigatório");
        if (preco <= 0) throw new IllegalArgumentException("preço deve ser maior que zero");
        nome = nome.trim();
        bloco = bloco.trim();
    }
}
