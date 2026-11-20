import { useState } from 'react'
import Header from './components/layout/Header.jsx'
import Aviso from './components/ui/Aviso.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useNotificacao } from './hooks/useNotificacao.js'
import LoginPage from './pages/LoginPage.jsx'
import VitrinePage from './pages/VitrinePage.jsx'
import MeusProdutosPage from './pages/MeusProdutosPage.jsx'
import PedidosPage from './pages/PedidosPage.jsx'

const ABAS = {
  vitrine: 'Vitrine',
  meusProdutos: 'Meus produtos',
  compras: 'Minhas compras',
  vendas: 'Pedidos recebidos',
}

export default function App() {
  const { usuario, entrar, sair } = useAuth()
  const { aviso, notificar } = useNotificacao()
  const [aba, setAba] = useState('vitrine')

  if (!usuario) return <LoginPage entrar={entrar} aviso={aviso} notificar={notificar} />

  return (
    <div className="app">
      <Header abas={ABAS} abaAtiva={aba} aoTrocarAba={setAba} usuario={usuario} aoSair={sair} />
      <Aviso aviso={aviso} />
      <main>
        {aba === 'vitrine' && <VitrinePage usuario={usuario} notificar={notificar} />}
        {aba === 'meusProdutos' && <MeusProdutosPage notificar={notificar} />}
        {aba === 'compras' && <PedidosPage visao="compras" notificar={notificar} />}
        {aba === 'vendas' && <PedidosPage visao="vendas" notificar={notificar} />}
      </main>
    </div>
  )
}
