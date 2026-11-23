# UniFood — Contrato de API entre os microserviços

Todas as rotas protegidas recebem o header `Authorization: Bearer <token>` (JWT gerado pelo serviço de Usuários).
Erros sempre no formato `{ "erro": "mensagem" }`. Todos os serviços devem habilitar **CORS** (o frontend chama direto).
Todos os serviços expõem `GET /health`.

| Serviço | Linguagem | Banco | Porta local | Responsável |
|---|---|---|---|---|
| servicos/usuarios-service | Java 17 / Spring Boot | MongoDB (`usuarios_db`) | 8081 | Renan |
| servicos/produtos-service | Java 17 / Spring Boot | MongoDB (`produtos_db`) | 8082 | Renan |
| servicos/pedidos-service | Node.js / Express | MySQL (`pedidos_db`) | 3001 | Ziltom |
| servicos/pagamentos-service | Node.js / Express | MySQL (`pagamentos_db`) | 3002 | Ziltom |
| frontend | React (Vite) | — | 5173 | Renan |

---

## 1. Usuários (Java + MongoDB) — PRONTO

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/usuarios` | — | Cadastrar aluno. Body `{ nome, email, matricula?, senha }` → 201 `UsuarioResponse` (409 se e-mail já existe) |
| POST | `/auth/login` | — | Body `{ email, senha }` → 200 `{ token, usuario: UsuarioResponse }` (401 se inválido) |
| GET | `/auth/validar` | Bearer | Valida o token → 200 `UsuarioResponse` / 401. **Usado por Produtos, Pedidos e Pagamentos.** |
| GET | `/usuarios/{id}` | — | Consultar usuário por id → 200 `UsuarioResponse` / 404 |

`UsuarioResponse = { id, nome, email, matricula }`

## 2. Produtos (Java + MongoDB) — PRONTO

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/produtos?bloco=B` | — | Lista produtos disponíveis (filtro opcional por bloco) |
| GET | `/produtos/{id}` | — | Detalhar produto. **Pedidos usa esta rota para pegar preço, bloco e vendedor.** |
| GET | `/produtos/meus` | Bearer | Produtos do vendedor logado |
| POST | `/produtos` | Bearer | Body `ProdutoRequest` → 201 `Produto` (vendedor = dono do token) |
| PUT | `/produtos/{id}` | Bearer | Editar (só o dono, senão 403) |
| DELETE | `/produtos/{id}` | Bearer | Remover (só o dono) → 204 |

`ProdutoRequest = { nome, descricao?, preco (>0), bloco, imagemUrl?, disponivel? }`
`Produto = { id, nome, descricao, preco, bloco, imagemUrl, disponivel, vendedorId, vendedorNome, criadoEm }`

---

## 3. Pedidos (Node + MySQL) — PRONTO

O frontend já chama estas rotas exatamente assim:

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/pedidos` | Bearer | Criar pedido (ver fluxo abaixo) → 201 `Pedido` |
| GET | `/pedidos/meus` | Bearer | Pedidos em que o usuário é comprador |
| GET | `/pedidos/recebidos` | Bearer | Pedidos em que o usuário é vendedor |
| GET | `/pedidos/:id` | Bearer | Detalhe (só comprador ou vendedor) |
| PATCH | `/pedidos/:id/status` | Bearer | Body `{ status }` — vendedor muda para `CONFIRMADO`, `PRONTO`, `ENTREGUE`; comprador ou vendedor pode `CANCELADO` |

Body do `POST /pedidos`:
```json
{
  "itens": [{ "produtoId": "665f...", "quantidade": 2 }],
  "tipoEntrega": "ENTREGA",          // ou "RETIRADA"
  "blocoEncontro": "Bloco C",        // obrigatório se ENTREGA; se RETIRADA usa o bloco do produto
  "metodoPagamento": "PIX"           // PIX | DINHEIRO | CARTAO
}
```

Fluxo do `POST /pedidos`:
1. `GET {USUARIOS_URL}/auth/validar` repassando o header Authorization → obtém o comprador (401 se falhar).
2. Para cada item: `GET {PRODUTOS_URL}/produtos/{produtoId}` → pega `preco`, `nome`, `bloco`, `vendedorId`, `disponivel` (400 se indisponível/inexistente).
3. Todos os itens devem ser do **mesmo vendedor** (400 caso contrário). Comprador não pode comprar de si mesmo.
4. Calcula `total = Σ preco × quantidade` (o preço vem do serviço de Produtos, **nunca do frontend**).
5. Salva no MySQL com `status = "PENDENTE"`.
6. `POST {PAGAMENTOS_URL}/pagamentos` repassando o Authorization, body `{ pedidoId, valor: total, metodo: metodoPagamento, vendedorId }`.
   Se o pagamento não puder ser registrado, o pedido é marcado `CANCELADO` e a resposta é **503**.

Regras adicionais: na `RETIRADA` o bloco é sempre o do produto (o `blocoEncontro` enviado é ignorado) e todos os itens precisam estar no mesmo bloco; itens repetidos do mesmo produto são somados.

**Status:** `PENDENTE → CONFIRMADO → PRONTO → ENTREGUE`. Só o vendedor avança, um passo por vez (fora de ordem → 409). `CANCELADO`: comprador ou vendedor, até o pedido ser entregue.

**Erros:** 400 dados inválidos · 401 token · 403 sem permissão (ex.: ver pedido alheio) · 404 não encontrado · 409 mudança de status inválida · 503 outro serviço fora do ar.

`Pedido` (resposta):
```json
{
  "id": 1, "compradorId": "...", "compradorNome": "...", "vendedorId": "...", "vendedorNome": "...",
  "itens": [{ "produtoId": "...", "nome": "Brigadeiro", "precoUnitario": 3.5, "quantidade": 2 }],
  "total": 7.0, "tipoEntrega": "ENTREGA", "blocoEncontro": "Bloco C",
  "status": "PENDENTE", "criadoEm": "2026-11-20T12:00:00Z"
}
```

Sugestão de tabelas MySQL: `pedidos(id, comprador_id, comprador_nome, vendedor_id, vendedor_nome, total, tipo_entrega, bloco_encontro, status, criado_em)` e `itens_pedido(id, pedido_id, produto_id, nome, preco_unitario, quantidade)`.

## 4. Pagamentos (Node + MySQL) — PRONTO (pagamento simulado)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/pagamentos` | Bearer | Registrar pagamento do pedido. Body `{ pedidoId, valor, metodo, vendedorId }` → 201 `Pagamento` com `status = "PENDENTE"` |
| GET | `/pagamentos/pedido/:pedidoId` | Bearer | Consultar pagamento do pedido |
| PATCH | `/pagamentos/:id/confirmar` | Bearer | Confirmar pagamento (só o vendedor) → `status = "CONFIRMADO"` |
| PATCH | `/pagamentos/:id/cancelar` | Bearer | Cancelar (comprador ou vendedor) → `status = "CANCELADO"` |

Todas validam o token em `GET {USUARIOS_URL}/auth/validar`.

`Pagamento = { id, pedidoId, compradorId, vendedorId, valor, metodo, status, criadoEm, confirmadoEm }`

O pagamento é **simulado**: não há cobrança real. O vendedor confirma quando recebe o valor combinado.

Regras: um pedido tem só um pagamento (409 se repetir); o comprador é sempre o dono do token; só o vendedor confirma; comprador ou vendedor cancelam; `CONFIRMADO` e `CANCELADO` são finais (409 se tentar mudar). Os endpoints de consulta e alteração só aceitam o comprador ou o vendedor (403 para os outros).

**Erros:** 400 dados inválidos · 401 token · 403 sem permissão · 404 não encontrado · 409 conflito de estado · 503 Usuários fora do ar.

## Variáveis de ambiente

| Serviço | Variáveis |
|---|---|
| servicos/usuarios-service | `MONGODB_URI`, `JWT_SECRET`, `PORT` |
| servicos/produtos-service | `MONGODB_URI`, `USUARIOS_URL`, `PORT` |
| servicos/pedidos-service | `DATABASE_URL` (MySQL), `DB_SSL`, `USUARIOS_URL`, `PRODUTOS_URL`, `PAGAMENTOS_URL`, `CORS_ORIGENS`, `PORT` |
| servicos/pagamentos-service | `DATABASE_URL` (MySQL), `DB_SSL`, `USUARIOS_URL`, `CORS_ORIGENS`, `PORT` |
| frontend | `VITE_USUARIOS_URL`, `VITE_PRODUTOS_URL`, `VITE_PEDIDOS_URL`, `VITE_PAGAMENTOS_URL` |
