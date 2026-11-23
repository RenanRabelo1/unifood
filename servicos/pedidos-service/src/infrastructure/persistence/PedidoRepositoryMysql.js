import { ItemPedido } from '../../domain/ItemPedido.js';
import { Pedido } from '../../domain/Pedido.js';

/**
 * Adaptador (GRASP Indirection / Pure Fabrication): implementa a porta PedidoRepository usando MySQL.
 * É o único arquivo que conhece SQL e o formato das colunas.
 * @implements {import('../../application/PedidoService.js').PedidoRepository}
 */
export class PedidoRepositoryMysql {
  constructor(pool) {
    this.pool = pool;
  }

  /** Pedido e itens são gravados na mesma transação: ou entram os dois, ou nenhum. */
  async salvar(pedido) {
    const conexao = await this.pool.getConnection();
    try {
      await conexao.beginTransaction();
      const [resultado] = await conexao.execute(
        `INSERT INTO pedidos (comprador_id, comprador_nome, vendedor_id, vendedor_nome, total, tipo_entrega, bloco_encontro, status, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pedido.compradorId, pedido.compradorNome, pedido.vendedorId, pedido.vendedorNome, pedido.total,
          pedido.tipoEntrega, pedido.blocoEncontro, pedido.status, pedido.criadoEm],
      );
      const id = resultado.insertId;
      await conexao.query(
        'INSERT INTO itens_pedido (pedido_id, produto_id, nome, preco_unitario, quantidade) VALUES ?',
        [pedido.itens.map((i) => [id, i.produtoId, i.nome, i.precoUnitario, i.quantidade])],
      );
      await conexao.commit();
      return new Pedido({ ...pedido, id });
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  }

  async buscarPorId(id) {
    const [pedido] = await this.#listar('SELECT * FROM pedidos WHERE id = ?', [id]);
    return pedido ?? null;
  }

  listarPorComprador(compradorId) {
    return this.#listar('SELECT * FROM pedidos WHERE comprador_id = ? ORDER BY criado_em DESC, id DESC', [compradorId]);
  }

  listarPorVendedor(vendedorId) {
    return this.#listar('SELECT * FROM pedidos WHERE vendedor_id = ? ORDER BY criado_em DESC, id DESC', [vendedorId]);
  }

  async atualizarStatus(id, status) {
    await this.pool.execute('UPDATE pedidos SET status = ? WHERE id = ?', [status, id]);
  }

  /** Busca os pedidos e, numa segunda consulta só, os itens de todos eles (evita uma consulta por pedido). */
  async #listar(sql, parametros) {
    const [linhas] = await this.pool.execute(sql, parametros);
    if (linhas.length === 0) return [];

    const [itens] = await this.pool.query(
      'SELECT * FROM itens_pedido WHERE pedido_id IN (?) ORDER BY id',
      [linhas.map((l) => l.id)],
    );
    return linhas.map((linha) => paraDominio(linha, itens.filter((i) => i.pedido_id === linha.id)));
  }
}

function paraDominio(linha, itens) {
  return new Pedido({
    id: linha.id,
    compradorId: linha.comprador_id,
    compradorNome: linha.comprador_nome,
    vendedorId: linha.vendedor_id,
    vendedorNome: linha.vendedor_nome,
    itens: itens.map((i) => new ItemPedido({
      produtoId: i.produto_id, nome: i.nome, precoUnitario: i.preco_unitario, quantidade: i.quantidade,
    })),
    total: Number(linha.total), // DECIMAL chega como texto
    tipoEntrega: linha.tipo_entrega,
    blocoEncontro: linha.bloco_encontro,
    status: linha.status,
    criadoEm: linha.criado_em,
  });
}
