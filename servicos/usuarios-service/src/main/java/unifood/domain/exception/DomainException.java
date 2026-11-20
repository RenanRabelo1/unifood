package unifood.domain.exception;

/** Base de todas as violações de regra de negócio. */
public abstract class DomainException extends RuntimeException {
    protected DomainException(String mensagem) {
        super(mensagem);
    }
}
