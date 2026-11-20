/** Guarda o token JWT do usuário logado no navegador. */
const CHAVE = 'unifood_token'

export const sessao = {
  token: () => localStorage.getItem(CHAVE),
  salvar: (token) => localStorage.setItem(CHAVE, token),
  limpar: () => localStorage.removeItem(CHAVE),
}
