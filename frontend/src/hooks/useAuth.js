import { useEffect, useState } from 'react'
import { sessao } from '../services/sessao.js'
import { usuariosService } from '../services/usuariosService.js'

/** Estado de autenticação: restaura a sessão salva e expõe entrar/sair. */
export function useAuth() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    if (!sessao.token()) return
    usuariosService.validarToken().then(setUsuario).catch(sessao.limpar)
  }, [])

  async function entrar(email, senha) {
    const { token, usuario } = await usuariosService.login(email, senha)
    sessao.salvar(token)
    setUsuario(usuario)
  }

  function sair() {
    sessao.limpar()
    setUsuario(null)
  }

  return { usuario, entrar, sair }
}
