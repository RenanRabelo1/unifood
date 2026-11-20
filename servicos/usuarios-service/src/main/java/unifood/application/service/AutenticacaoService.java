package unifood.application.service;

import org.springframework.stereotype.Service;
import unifood.application.exception.CredenciaisInvalidasException;
import unifood.application.exception.TokenInvalidoException;
import unifood.application.port.CodificadorSenha;
import unifood.application.port.ProvedorToken;
import unifood.application.port.UsuarioRepository;
import unifood.domain.model.Usuario;

/** Casos de uso de autenticação: login e validação de token (usada pelos outros microserviços). */
@Service
public class AutenticacaoService {

    public record Sessao(String token, Usuario usuario) {}

    private final UsuarioRepository repositorio;
    private final CodificadorSenha codificador;
    private final ProvedorToken provedorToken;

    public AutenticacaoService(UsuarioRepository repositorio, CodificadorSenha codificador, ProvedorToken provedorToken) {
        this.repositorio = repositorio;
        this.codificador = codificador;
        this.provedorToken = provedorToken;
    }

    public Sessao login(String email, String senha) {
        Usuario usuario = repositorio.buscarPorEmail(Usuario.normalizarEmail(email))
                .filter(u -> u.senhaConfere(senha, codificador))
                .orElseThrow(CredenciaisInvalidasException::new);
        return new Sessao(provedorToken.gerar(usuario), usuario);
    }

    public Usuario validar(String token) {
        return provedorToken.extrairUsuarioId(token)
                .flatMap(repositorio::buscarPorId)
                .orElseThrow(TokenInvalidoException::new);
    }
}
