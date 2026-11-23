import { useState } from 'react'
import ImagemProduto from '../ui/ImagemProduto.jsx'

export const PRODUTO_VAZIO = { nome: '', descricao: '', preco: '', bloco: '', imagemUrl: '', disponivel: true }

export default function ProdutoForm({ inicial, editando, aoSalvar, aoCancelar }) {
  const [form, setForm] = useState(inicial)
  const [imagemFalhou, setImagemFalhou] = useState(false)

  const alterar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  function enviar(e) {
    e.preventDefault()
    aoSalvar({ ...form, preco: Number(form.preco), imagemUrl: (form.imagemUrl || '').trim() })
  }

  return (
    <form className="card" onSubmit={enviar}>
      <h3>{editando ? 'Editar produto' : 'Novo produto'}</h3>
      <input placeholder="Nome" value={form.nome} onChange={alterar('nome')} required />
      <textarea placeholder="Descrição" value={form.descricao || ''} onChange={alterar('descricao')} />
      <input placeholder="Preço" type="number" step="0.01" min="0.01" value={form.preco} onChange={alterar('preco')} required />
      <input placeholder="Bloco de retirada (ex.: Bloco A)" value={form.bloco} onChange={alterar('bloco')} required />
      <input
        type="url"
        pattern="https://.+"
        title="Cole o link direto da foto, começando com https://"
        placeholder="Link da foto (https://..., opcional)"
        value={form.imagemUrl || ''}
        onChange={(e) => { setImagemFalhou(false); setForm({ ...form, imagemUrl: e.target.value.trim() }) }} // links colados costumam vir com espaço sobrando
      />
      {imagemFalhou && (
        <p className="aviso-img">
          Não consegui carregar essa foto. Use o link direto da imagem (costuma terminar em .jpg ou .png),
          não o link da página onde ela aparece.
        </p>
      )}
      {!imagemFalhou && (
        <ImagemProduto key={form.imagemUrl} url={form.imagemUrl?.trim()} alt="Prévia da foto" className="previa"
          aoFalhar={() => setImagemFalhou(true)} />
      )}
      <label className="check">
        <input type="checkbox" checked={form.disponivel} onChange={alterar('disponivel')} /> Disponível
      </label>
      <button type="submit">{editando ? 'Salvar' : 'Cadastrar'}</button>
      {editando && <button type="button" className="link" onClick={aoCancelar}>Cancelar edição</button>}
    </form>
  )
}
