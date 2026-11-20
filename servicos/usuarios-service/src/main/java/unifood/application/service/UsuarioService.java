package unifood.application.service;

import org.springframework.stereotype.Service;
import unifood.application.port.CodificadorSenha;
import unifood.application.port.UsuarioRepository;
import unifood.domain.exception.EmailJaCadastradoException;
import unifood.domain.exception.UsuarioNaoEncontradoException;
import unifood.domain.model.Usuario;

/**
 * Casos de uso de cadastro e consulta de usuários (SRP: não trata autenticação).
 * GRASP Controller: coordena o caso de uso, delegando regras ao domínio e I/O às portas.
 */
@Service
public class UsuarioService {

    private final UsuarioRepository repositorio;
    private final CodificadorSenha codificador;

    public UsuarioService(UsuarioRepository repositorio, CodificadorSenha codificador) {
        this.repositorio = repositorio;
        this.codificador = codificador;
    }

    public Usuario cadastrar(String nome, String email, String matricula, String senha) {
        if (repositorio.existePorEmail(Usuario.normalizarEmail(email))) {
            throw new EmailJaCadastradoException();
        }
        Usuario novo = Usuario.novo(nome, email, matricula, codificador.gerarHash(senha));
        return repositorio.salvar(novo);
    }

    public Usuario buscarPorId(String id) {
        return repositorio.buscarPorId(id).orElseThrow(UsuarioNaoEncontradoException::new);
    }
}
