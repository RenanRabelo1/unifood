# pedidos-service

Microsserviço de pedidos do UniFood. **Node.js (Express) · MySQL (`pedidos_db`)**.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/pedidos` | Criar pedido: valida, calcula o total e registra o pagamento → 201 |
| GET | `/pedidos/meus` | Pedidos em que o usuário é o comprador |
| GET | `/pedidos/recebidos` | Pedidos em que o usuário é o vendedor |
| GET | `/pedidos/:id` | Detalhe (só comprador ou vendedor → senão 403) |
| PATCH | `/pedidos/:id/status` | Alterar status (regras abaixo) |
| GET | `/health` | Verificação de saúde (sem token) |

Todas as rotas `/pedidos` exigem `Authorization: Bearer <token>`; o token é validado no serviço de Usuários.
Formato dos dados em [`/docs/API.md`](../../docs/API.md).

## Como o `POST /pedidos` funciona

1. `GET {USUARIOS_URL}/auth/validar` → quem é o comprador (401 se o token for inválido).
2. `GET {PRODUTOS_URL}/produtos/:id` para cada item → preço, bloco, vendedor e disponibilidade. **O preço nunca vem do cliente.**
3. Regras (no `domain/Pedido.js`): itens disponíveis, todos do mesmo vendedor, comprador diferente do vendedor.
   Na **retirada** o bloco é o do produto; na **entrega** é o `blocoEncontro` informado.
4. Salva o pedido e os itens (mesma transação) com status `PENDENTE`.
5. `POST {PAGAMENTOS_URL}/pagamentos` repassando o token. Se falhar, o pedido é marcado `CANCELADO` e o cliente recebe 503.

## Status do pedido

`PENDENTE → CONFIRMADO → PRONTO → ENTREGUE`: só o **vendedor** avança, um passo por vez (fora de ordem → 409).
`CANCELADO`: comprador ou vendedor, enquanto o pedido não foi entregue nem cancelado.

Erros: 400 dados inválidos · 401 token · 403 sem permissão · 404 não encontrado · 409 status inválido · 503 outro serviço fora do ar.

## Rodando

```bash
cd servicos/pedidos-service
cp .env.example .env        # ajuste DATABASE_URL e as URLs dos outros serviços
npm install
npm run dev                 # http://localhost:3001  (cria as tabelas sozinho na primeira execução)
npm test                    # testes (não precisam de banco nem dos outros serviços)
```

Com `NODE_ENV=production`, `DATABASE_URL`, `USUARIOS_URL`, `PRODUTOS_URL` e `PAGAMENTOS_URL` são obrigatórios.

## Estrutura

```
src/
├── server.js                  composition root: único lugar que escolhe as implementações
├── app.js                     monta o Express
├── config/env.js              variáveis de ambiente
├── erros.js                   todos os erros do serviço (a api traduz cada um para um status HTTP)
├── domain/                    NÚCLEO — JS puro, sem Express/MySQL/HTTP
│   ├── Pedido.js              entidade: cria, calcula total, controla quem altera o status
│   └── ItemPedido.js, StatusPedido.js
├── application/               CASOS DE USO
│   └── PedidoService.js       criar, listar, detalhar, alterar status (contratos/portas descritos no topo)
├── infrastructure/            DETALHES TÉCNICOS — implementam as portas
│   ├── database/pool.js       conexão MySQL + criação das tabelas
│   ├── persistence/PedidoRepositoryMysql.js
│   └── servicosExternos.js    chamadas HTTP: Usuários, Produtos e Pagamentos
└── api/                       ENTRADA HTTP
    ├── rotas.js               controllers
    ├── validadores.js, dto.js
    └── middlewares/           autenticar (valida token no Usuários), tratadorErros
```

Regra de dependência: `api` e `infrastructure` → `application` → `domain`.
