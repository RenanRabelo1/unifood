package unifood.api.auth;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import unifood.application.port.AutenticacaoGateway;
import unifood.application.port.AutenticacaoGateway.UsuarioAutenticado;

/**
 * Resolve @UsuarioLogado consultando o serviço de Usuários.
 * Tira dos controllers a responsabilidade de validar token (SRP, sem repetição).
 */
@Component
public class UsuarioLogadoResolver implements HandlerMethodArgumentResolver {

    private final AutenticacaoGateway autenticacao;

    public UsuarioLogadoResolver(AutenticacaoGateway autenticacao) {
        this.autenticacao = autenticacao;
    }

    @Override
    public boolean supportsParameter(MethodParameter parametro) {
        return parametro.hasParameterAnnotation(UsuarioLogado.class)
                && parametro.getParameterType().equals(UsuarioAutenticado.class);
    }

    @Override
    public UsuarioAutenticado resolveArgument(MethodParameter parametro, ModelAndViewContainer mav,
                                              NativeWebRequest request, WebDataBinderFactory binder) {
        return autenticacao.autenticar(request.getHeader(HttpHeaders.AUTHORIZATION));
    }
}
