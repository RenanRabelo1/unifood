import { criarCliente } from './http.js'

const http = criarCliente('produtos')

export const produtosService = {
  listar: (bloco) => http('/produtos' + (bloco ? `?bloco=${encodeURIComponent(bloco)}` : '')),
  meus: () => http('/produtos/meus'),
  criar: (produto) => http('/produtos', { method: 'POST', body: produto }),
  editar: (id, produto) => http(`/produtos/${id}`, { method: 'PUT', body: produto }),
  remover: (id) => http(`/produtos/${id}`, { method: 'DELETE' }),
}
