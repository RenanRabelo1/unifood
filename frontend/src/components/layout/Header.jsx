export default function Header({ abas, abaAtiva, aoTrocarAba, usuario, aoSair }) {
  return (
    <header>
      <h1>🍫 UniFood</h1>
      <nav>
        {Object.entries(abas).map(([chave, rotulo]) => (
          <button key={chave} className={abaAtiva === chave ? 'ativa' : ''} onClick={() => aoTrocarAba(chave)}>
            {rotulo}
          </button>
        ))}
      </nav>
      <div className="user">
        Olá, {usuario.nome.split(' ')[0]} <button className="link" onClick={aoSair}>Sair</button>
      </div>
    </header>
  )
}
