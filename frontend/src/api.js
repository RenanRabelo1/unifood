const env = import.meta.env
export const URLS = {
  usuarios: env.VITE_USUARIOS_URL || 'http://localhost:8081',
  produtos: env.VITE_PRODUTOS_URL || 'http://localhost:8082',
  pedidos: env.VITE_PEDIDOS_URL || 'http://localhost:3001',
  pagamentos: env.VITE_PAGAMENTOS_URL || 'http://localhost:3002',
}

export function getToken() {
  return localStorage.getItem('unifood_token')
}

async function req(servico, caminho, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(URLS[servico] + caminho, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error(`Serviço de ${servico} indisponível`)
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.erro || data.message || `Erro ${res.status} em ${servico}`)
  return data
}

export const api = {
  // Usuários
  cadastrar: (u) => req('usuarios', '/usuarios', { method: 'POST', body: u }),
  login: (email, senha) => req('usuarios', '/auth/login', { method: 'POST', body: { email, senha } }),
  validar: () => req('usuarios', '/auth/validar'),
  // Produtos
  produtos: (bloco) => req('produtos', '/produtos' + (bloco ? `?bloco=${encodeURIComponent(bloco)}` : '')),
  meusProdutos: () => req('produtos', '/produtos/meus'),
  criarProduto: (p) => req('produtos', '/produtos', { method: 'POST', body: p }),
  editarProduto: (id, p) => req('produtos', `/produtos/${id}`, { method: 'PUT', body: p }),
  removerProduto: (id) => req('produtos', `/produtos/${id}`, { method: 'DELETE' }),
  // Pedidos
  criarPedido: (p) => req('pedidos', '/pedidos', { method: 'POST', body: p }),
  meusPedidos: () => req('pedidos', '/pedidos/meus'),
  pedidosRecebidos: () => req('pedidos', '/pedidos/recebidos'),
  alterarStatus: (id, status) => req('pedidos', `/pedidos/${id}/status`, { method: 'PATCH', body: { status } }),
  // Pagamentos
  pagamentoDoPedido: (pedidoId) => req('pagamentos', `/pagamentos/pedido/${pedidoId}`),
  confirmarPagamento: (id) => req('pagamentos', `/pagamentos/${id}/confirmar`, { method: 'PATCH' }),
  cancelarPagamento: (id) => req('pagamentos', `/pagamentos/${id}/cancelar`, { method: 'PATCH' }),
}
