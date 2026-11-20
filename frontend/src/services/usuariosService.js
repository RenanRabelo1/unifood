import { criarCliente } from './http.js'

const http = criarCliente('usuarios')

export const usuariosService = {
  cadastrar: (usuario) => http('/usuarios', { method: 'POST', body: usuario }),
  login: (email, senha) => http('/auth/login', { method: 'POST', body: { email, senha } }),
  validarToken: () => http('/auth/validar'),
}
