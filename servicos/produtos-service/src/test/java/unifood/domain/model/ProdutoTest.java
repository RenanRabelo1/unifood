package unifood.domain.model;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import unifood.domain.exception.AcessoNegadoException;

class ProdutoTest {

    private final DadosProduto brigadeiro = new DadosProduto(" Brigadeiro ", "Gourmet", 3.5, " Bloco A ", null, null);

    @Test
    void novoProdutoNasceDisponivelEComDadosNormalizados() {
        Produto p = Produto.novo(brigadeiro, "ana", "Ana");
        assertTrue(p.isDisponivel());
        assertEquals("Brigadeiro", p.getNome());
        assertEquals("Bloco A", p.getBloco());
    }

    @Test
    void somenteODonoPassaNaVerificacao() {
        Produto p = Produto.novo(brigadeiro, "ana", "Ana");
        assertDoesNotThrow(() -> p.garantirDono("ana"));
        assertThrows(AcessoNegadoException.class, () -> p.garantirDono("bruno"));
    }

    @Test
    void precoInvalidoERejeitado() {
        assertThrows(IllegalArgumentException.class, () -> new DadosProduto("X", null, 0, "B", null, null));
    }
}
