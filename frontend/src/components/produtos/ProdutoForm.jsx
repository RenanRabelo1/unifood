import { useState } from 'react'

export const PRODUTO_VAZIO = { nome: '', descricao: '', preco: '', bloco: '', imagemUrl: '', disponivel: true }

export default function ProdutoForm({ inicial, editando, aoSalvar, aoCancelar }) {
  const [form, setForm] = useState(inicial)

  const alterar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  function enviar(e) {
    e.preventDefault()
    aoSalvar({ ...form, preco: Number(form.preco) })
  }

  return (
    <form className="card" onSubmit={enviar}>
      <h3>{editando ? 'Editar produto' : 'Novo produto'}</h3>
      <input placeholder="Nome" value={form.nome} onChange={alterar('nome')} required />
      <textarea placeholder="Descrição" value={form.descricao || ''} onChange={alterar('descricao')} />
      <input placeholder="Preço" type="number" step="0.01" min="0.01" value={form.preco} onChange={alterar('preco')} required />
      <input placeholder="Bloco de retirada (ex.: Bloco A)" value={form.bloco} onChange={alterar('bloco')} required />
      <input placeholder="URL da imagem (opcional)" value={form.imagemUrl || ''} onChange={alterar('imagemUrl')} />
      <label className="check">
        <input type="checkbox" checked={form.disponivel} onChange={alterar('disponivel')} /> Disponível
      </label>
      <button type="submit">{editando ? 'Salvar' : 'Cadastrar'}</button>
      {editando && <button type="button" className="link" onClick={aoCancelar}>Cancelar edição</button>}
    </form>
  )
}
