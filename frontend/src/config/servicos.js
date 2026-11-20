/** Endereço de cada microserviço (definidos por variáveis VITE_* no deploy). */
const env = import.meta.env

export const SERVICOS = {
  usuarios: env.VITE_USUARIOS_URL || 'http://localhost:8081',
  produtos: env.VITE_PRODUTOS_URL || 'http://localhost:8082',
  pedidos: env.VITE_PEDIDOS_URL || 'http://localhost:3001',
  pagamentos: env.VITE_PAGAMENTOS_URL || 'http://localhost:3002',
}
