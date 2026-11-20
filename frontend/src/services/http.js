import { SERVICOS } from '../config/servicos.js'
import { sessao } from './sessao.js'

/**
 * Cria um cliente HTTP para um microserviço.
 * Envia o token automaticamente e converte erros no formato { erro } em exceções.
 */
export function criarCliente(servico) {
  const baseUrl = SERVICOS[servico]

  return async function requisitar(caminho, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' }
    const token = sessao.token()
    if (token) headers.Authorization = `Bearer ${token}`

    let resposta
    try {
      resposta = await fetch(baseUrl + caminho, { method, headers, body: body ? JSON.stringify(body) : undefined })
    } catch {
      throw new Error(`Serviço de ${servico} indisponível`)
    }

    if (resposta.status === 204) return null
    const dados = await resposta.json().catch(() => ({}))
    if (!resposta.ok) throw new Error(dados.erro || dados.message || `Erro ${resposta.status} em ${servico}`)
    return dados
  }
}
