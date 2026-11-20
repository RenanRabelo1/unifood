package unifood.application.service;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import unifood.application.exception.CredenciaisInvalidasException;
import unifood.application.exception.TokenInvalidoException;

class AutenticacaoServiceTest {

    private final Fakes.RepositorioEmMemoria repo = new Fakes.RepositorioEmMemoria();
    private final Fakes.CodificadorReverso codificador = new Fakes.CodificadorReverso();
    private final UsuarioService usuarios = new UsuarioService(repo, codificador);
    private final AutenticacaoService auth = new AutenticacaoService(repo, codificador, new Fakes.TokenSimples());

    @Test
    void loginGeraTokenQueDepoisEValidado() {
        String id = usuarios.cadastrar("Ana", "ana@uni.br", null, "123456").getId();
        AutenticacaoService.Sessao sessao = auth.login("ANA@uni.br", "123456");
        assertEquals(id, auth.validar(sessao.token()).getId());
    }

    @Test
    void senhaErradaFalha() {
        usuarios.cadastrar("Ana", "ana@uni.br", null, "123456");
        assertThrows(CredenciaisInvalidasException.class, () -> auth.login("ana@uni.br", "errada"));
    }

    @Test
    void tokenInvalidoFalha() {
        assertThrows(TokenInvalidoException.class, () -> auth.validar("lixo"));
    }
}
