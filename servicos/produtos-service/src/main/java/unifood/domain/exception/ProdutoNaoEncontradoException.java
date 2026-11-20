package unifood.domain.exception;

public class ProdutoNaoEncontradoException extends DomainException {
    public ProdutoNaoEncontradoException() {
        super("Produto não encontrado");
    }
}
