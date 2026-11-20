package unifood.infrastructure.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import unifood.application.port.CodificadorSenha;

@Component
class BCryptCodificadorSenha implements CodificadorSenha {

    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Override
    public String gerarHash(String senha) {
        return bcrypt.encode(senha);
    }

    @Override
    public boolean confere(String senhaDigitada, String hash) {
        return bcrypt.matches(senhaDigitada, hash);
    }
}
