package unifood.domain.exception;

public class UsuarioNaoEncontradoException extends DomainException {
    public UsuarioNaoEncontradoException() {
        super("Usuário não encontrado");
    }
}
