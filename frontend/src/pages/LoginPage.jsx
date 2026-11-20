import { useState } from 'react'
import Aviso from '../components/ui/Aviso.jsx'
import { usuariosService } from '../services/usuariosService.js'

export default function LoginPage({ entrar, aviso, notificar }) {
  const [modo, setModo] = useState('login')
  const [form, setForm] = useState({ nome: '', email: '', matricula: '', senha: '' })
  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })
  const cadastrando = modo === 'cadastro'

  async function enviar(e) {
    e.preventDefault()
    try {
      if (cadastrando) await usuariosService.cadastrar(form)
      await entrar(form.email, form.senha)
    } catch (err) {
      notificar(err.message, 'erro')
    }
  }

  return (
    <div className="auth">
      <h1>🍫 UniFood</h1>
      <p>Compre e venda lanches entre alunos do campus.</p>
      <Aviso aviso={aviso} />
      <form onSubmit={enviar} className="card">
        {cadastrando && <input placeholder="Nome" value={form.nome} onChange={alterar('nome')} required />}
        <input placeholder="E-mail" type="email" value={form.email} onChange={alterar('email')} required />
        {cadastrando && <input placeholder="Matrícula (opcional)" value={form.matricula} onChange={alterar('matricula')} />}
        <input placeholder="Senha" type="password" value={form.senha} onChange={alterar('senha')} required minLength={6} />
        <button type="submit">{cadastrando ? 'Cadastrar' : 'Entrar'}</button>
        <button type="button" className="link" onClick={() => setModo(cadastrando ? 'login' : 'cadastro')}>
          {cadastrando ? 'Já tenho conta' : 'Não tem conta? Cadastre-se'}
        </button>
      </form>
    </div>
  )
}
