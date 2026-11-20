package unifood.domain.exception;

public class EmailJaCadastradoException extends DomainException {
    public EmailJaCadastradoException() {
        super("E-mail já cadastrado");
    }
}
