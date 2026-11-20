package unifood.api.handler;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import unifood.api.dto.ErroResponse;
import unifood.application.exception.CredenciaisInvalidasException;
import unifood.application.exception.TokenInvalidoException;
import unifood.domain.exception.EmailJaCadastradoException;
import unifood.domain.exception.UsuarioNaoEncontradoException;

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

    @ExceptionHandler({CredenciaisInvalidasException.class, TokenInvalidoException.class})
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErroResponse naoAutorizado(RuntimeException e) {
        return new ErroResponse(e.getMessage());
    }

    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErroResponse naoEncontrado(RuntimeException e) {
        return new ErroResponse(e.getMessage());
    }

    @ExceptionHandler(EmailJaCadastradoException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErroResponse conflito(RuntimeException e) {
        return new ErroResponse(e.getMessage());
    }
}
