import { PagamentoJaExisteError } from '../../erros.js';
import { Pagamento } from '../../domain/Pagamento.js';

const ERRO_DUPLICADO = 'ER_DUP_ENTRY';

/**
 * Adaptador (GRASP Indirection / Pure Fabrication): implementa a porta PagamentoRepository usando MySQL.
 * É o único arquivo que conhece SQL e o formato das colunas.
 * @implements {import('../../application/PagamentoService.js').PagamentoRepository}
 */
export class PagamentoRepositoryMysql {
  constructor(pool) {
    this.pool = pool;
  }

  async salvar(pagamento) {
    try {
      const [resultado] = await this.pool.execute(
        `INSERT INTO pagamentos (pedido_id, comprador_id, vendedor_id, valor, metodo, status, criado_em, confirmado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [pagamento.pedidoId, pagamento.compradorId, pagamento.vendedorId, pagamento.valor, pagamento.metodo,
          pagamento.status, pagamento.criadoEm, pagamento.confirmadoEm],
      );
      return new Pagamento({ ...pagamento, id: resultado.insertId });
    } catch (erro) {
      // O índice único em pedido_id é a garantia final contra dois registros simultâneos do mesmo pedido.
      if (erro.code === ERRO_DUPLICADO) throw new PagamentoJaExisteError();
      throw erro;
    }
  }

  buscarPorId(id) {
    return this.#buscarUm('SELECT * FROM pagamentos WHERE id = ?', [id]);
  }

  buscarPorPedidoId(pedidoId) {
    return this.#buscarUm('SELECT * FROM pagamentos WHERE pedido_id = ?', [pedidoId]);
  }

  async atualizar(pagamento, statusEsperado) {
    const [resultado] = await this.pool.execute(
      'UPDATE pagamentos SET status = ?, confirmado_em = ? WHERE id = ? AND status = ?',
      [pagamento.status, pagamento.confirmadoEm, pagamento.id, statusEsperado],
    );
    return resultado.affectedRows === 1;
  }

  async #buscarUm(sql, parametros) {
    const [linhas] = await this.pool.execute(sql, parametros);
    return linhas.length ? paraDominio(linhas[0]) : null;
  }
}

function paraDominio(linha) {
  return new Pagamento({
    id: linha.id,
    pedidoId: linha.pedido_id,
    compradorId: linha.comprador_id,
    vendedorId: linha.vendedor_id,
    valor: Number(linha.valor), // DECIMAL chega como texto
    metodo: linha.metodo,
    status: linha.status,
    criadoEm: linha.criado_em,
    confirmadoEm: linha.confirmado_em,
  });
}
