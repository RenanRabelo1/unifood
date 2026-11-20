package unifood.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import unifood.api.dto.CadastroUsuarioRequest;
import unifood.api.dto.UsuarioResponse;
import unifood.application.service.UsuarioService;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarios;

    public UsuarioController(UsuarioService usuarios) {
        this.usuarios = usuarios;
    }

    /** Cadastrar aluno. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse cadastrar(@Valid @RequestBody CadastroUsuarioRequest req) {
        return UsuarioResponse.de(usuarios.cadastrar(req.nome(), req.email(), req.matricula(), req.senha()));
    }

    /** Consultar usuário por id (ex.: nome do vendedor ou do comprador). */
    @GetMapping("/{id}")
    public UsuarioResponse buscar(@PathVariable String id) {
        return UsuarioResponse.de(usuarios.buscarPorId(id));
    }
}
