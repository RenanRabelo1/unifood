package unifood.domain.exception;

public class AcessoNegadoException extends DomainException {
    public AcessoNegadoException() {
        super("Apenas o dono pode alterar este produto");
    }
}
