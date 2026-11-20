package unifood.api.handler;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import unifood.api.dto.ErroResponse;
import unifood.application.exception.NaoAutenticadoException;
import unifood.application.exception.ServicoIndisponivelException;
import unifood.domain.exception.AcessoNegadoException;
import unifood.domain.exception.ProdutoNaoEncontradoException;

/** Único lugar que traduz exceções em status HTTP: os controllers ficam só com o caminho feliz. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErroResponse validacao(MethodArgumentNotValidException e) {
        return new ErroResponse(e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + " " + f.getDefaultMessage())
                .collect(Collectors.joining("; ")));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErroResponse dadosInvalidos(RuntimeException e) {
        return new ErroResponse(e.getMessage());
    }

    @ExceptionHandler(NaoAutenticadoException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErroResponse naoAutenticado(RuntimeException e) {
        return new ErroResponse(e.getMessage());
    }

    @ExceptionHandler(AcessoNegadoException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErroResponse proibido(RuntimeException e) {
        return new ErroResponse(e.getMessage());
    }

    @ExceptionHandler(ProdutoNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErroResponse naoEncontrado(RuntimeException e) {
        return new ErroResponse(e.getMessage());
    }

    @ExceptionHandler(ServicoIndisponivelException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ErroResponse indisponivel(RuntimeException e) {
        return new ErroResponse(e.getMessage());
    }
}
