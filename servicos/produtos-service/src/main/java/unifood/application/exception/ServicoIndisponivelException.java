package unifood.application.exception;

public class ServicoIndisponivelException extends RuntimeException {
    public ServicoIndisponivelException(String servico) {
        super("Serviço de " + servico + " indisponível");
    }
}
