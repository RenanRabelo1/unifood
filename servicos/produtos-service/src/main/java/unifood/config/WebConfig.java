package unifood.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import unifood.api.auth.UsuarioLogadoResolver;

/** Configuração HTTP transversal: CORS e injeção do usuário logado nos controllers. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] origensPermitidas;
    private final UsuarioLogadoResolver usuarioLogadoResolver;

    public WebConfig(@Value("${cors.origens:*}") String[] origensPermitidas, UsuarioLogadoResolver usuarioLogadoResolver) {
        this.origensPermitidas = origensPermitidas;
        this.usuarioLogadoResolver = usuarioLogadoResolver;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(origensPermitidas)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(usuarioLogadoResolver);
    }
}
