-- Banco próprio do serviço: pagamentos_db
CREATE TABLE IF NOT EXISTS pagamentos (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  pedido_id       INT UNSIGNED  NOT NULL,
  comprador_id    VARCHAR(64)   NOT NULL,
  vendedor_id     VARCHAR(64)   NOT NULL,
  valor           DECIMAL(10,2) NOT NULL,
  metodo          VARCHAR(10)   NOT NULL,
  status          VARCHAR(10)   NOT NULL,
  criado_em       DATETIME(3)   NOT NULL,
  confirmado_em   DATETIME(3)   NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pagamentos_pedido (pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
