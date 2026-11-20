import { useCallback, useState } from 'react'

/** Mensagem temporária de sucesso/erro exibida no topo da tela. */
export function useNotificacao(duracaoMs = 3500) {
  const [aviso, setAviso] = useState(null)

  const notificar = useCallback((msg, tipo = 'ok') => {
    setAviso({ msg, tipo })
    setTimeout(() => setAviso(null), duracaoMs)
  }, [duracaoMs])

  return { aviso, notificar }
}
