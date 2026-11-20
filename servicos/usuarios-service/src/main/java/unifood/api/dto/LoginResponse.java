package unifood.api.dto;

import unifood.application.service.AutenticacaoService.Sessao;

public record LoginResponse(String token, UsuarioResponse usuario) {

    public static LoginResponse de(Sessao sessao) {
        return new LoginResponse(sessao.token(), UsuarioResponse.de(sessao.usuario()));
    }
}
