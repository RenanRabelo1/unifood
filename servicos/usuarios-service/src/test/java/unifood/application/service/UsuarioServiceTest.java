package unifood.application.service;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import unifood.domain.exception.EmailJaCadastradoException;
import unifood.domain.exception.UsuarioNaoEncontradoException;
import unifood.domain.model.Usuario;

class UsuarioServiceTest {

    private final UsuarioService service = new UsuarioService(new Fakes.RepositorioEmMemoria(), new Fakes.CodificadorReverso());

    @Test
    void cadastraNormalizandoEmailESemGuardarSenhaPura() {
        Usuario u = service.cadastrar(" Ana ", " ANA@Uni.br ", null, "123456");
        assertEquals("ana@uni.br", u.getEmail());
        assertEquals("Ana", u.getNome());
        assertNotEquals("123456", u.getSenhaHash());
    }

    @Test
    void recusaEmailDuplicadoIgnorandoMaiusculas() {
        service.cadastrar("Ana", "ana@uni.br", null, "123456");
        assertThrows(EmailJaCadastradoException.class, () -> service.cadastrar("Ana 2", "ANA@uni.br", null, "123456"));
    }

    @Test
    void buscarIdInexistenteLancaExcecao() {
        assertThrows(UsuarioNaoEncontradoException.class, () -> service.buscarPorId("nao-existe"));
    }
}
