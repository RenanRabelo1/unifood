-- Banco próprio do serviço: pedidos_db
CREATE TABLE IF NOT EXISTS pedidos (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  comprador_id    VARCHAR(64)   NOT NULL,
  comprador_nome  VARCHAR(120)  NOT NULL,
  vendedor_id     VARCHAR(64)   NOT NULL,
  vendedor_nome   VARCHAR(120)  NOT NULL,
  total           DECIMAL(10,2) NOT NULL,
  tipo_entrega    VARCHAR(10)   NOT NULL,
  bloco_encontro  VARCHAR(40)   NOT NULL,
  status          VARCHAR(12)   NOT NULL,
  criado_em       DATETIME(3)   NOT NULL,
  PRIMARY KEY (id),
  KEY idx_pedidos_comprador (comprador_id),
  KEY idx_pedidos_vendedor (vendedor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS itens_pedido (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  pedido_id       INT UNSIGNED  NOT NULL,
  produto_id      VARCHAR(64)   NOT NULL,
  nome            VARCHAR(120)  NOT NULL,
  preco_unitario  DECIMAL(10,2) NOT NULL,
  quantidade      INT UNSIGNED  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_itens_pedido (pedido_id),
  CONSTRAINT fk_itens_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
