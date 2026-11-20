package unifood.domain.model;

import java.time.Instant;
import unifood.domain.exception.AcessoNegadoException;

/**
 * Entidade de domínio, sem dependência de framework.
 * GRASP Information Expert: o Produto sabe quem é seu dono e como se atualizar.
 */
public class Produto {

    private final String id;
    private String nome;
    private String descricao;
    private double preco;
    private String bloco;
    private String imagemUrl;
    private boolean disponivel;
    private final String vendedorId;
    private final String vendedorNome;
    private final Instant criadoEm;

    public Produto(String id, String nome, String descricao, double preco, String bloco, String imagemUrl,
                   boolean disponivel, String vendedorId, String vendedorNome, Instant criadoEm) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.preco = preco;
        this.bloco = bloco;
        this.imagemUrl = imagemUrl;
        this.disponivel = disponivel;
        this.vendedorId = vendedorId;
        this.vendedorNome = vendedorNome;
        this.criadoEm = criadoEm;
    }

    /** GRASP Creator: cria um produto novo já vinculado ao vendedor. */
    public static Produto novo(DadosProduto dados, String vendedorId, String vendedorNome) {
        Produto p = new Produto(null, null, null, 0, null, null, true, vendedorId, vendedorNome, Instant.now());
        p.atualizar(dados);
        return p;
    }

    public void atualizar(DadosProduto dados) {
        this.nome = dados.nome();
        this.descricao = dados.descricao();
        this.preco = dados.preco();
        this.bloco = dados.bloco();
        this.imagemUrl = dados.imagemUrl();
        if (dados.disponivel() != null) this.disponivel = dados.disponivel();
    }

    public boolean pertenceA(String usuarioId) {
        return vendedorId.equals(usuarioId);
    }

    /** Regra: apenas o dono pode editar ou remover. */
    public void garantirDono(String usuarioId) {
        if (!pertenceA(usuarioId)) throw new AcessoNegadoException();
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
    public double getPreco() { return preco; }
    public String getBloco() { return bloco; }
    public String getImagemUrl() { return imagemUrl; }
    public boolean isDisponivel() { return disponivel; }
    public String getVendedorId() { return vendedorId; }
    public String getVendedorNome() { return vendedorNome; }
    public Instant getCriadoEm() { return criadoEm; }
}
