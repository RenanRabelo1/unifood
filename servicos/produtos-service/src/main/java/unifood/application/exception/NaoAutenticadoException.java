package unifood.application.exception;

public class NaoAutenticadoException extends RuntimeException {
    public NaoAutenticadoException() {
        super("Token inválido ou ausente");
    }
}
