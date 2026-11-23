# pagamentos-service

Microsserviço de pagamentos do UniFood. **Node.js (Express) · MySQL (`pagamentos_db`)**.

> **O pagamento é simulado.** Nenhum dinheiro é cobrado nem movimentado e não há integração com banco, PIX ou operadora de cartão.
> O pagamento nasce `PENDENTE` quando o pedido é criado, e o **vendedor** o marca como `CONFIRMADO` quando recebe o valor
> combinado com o comprador (PIX, dinheiro ou cartão na entrega).

| Método | Rota | Quem pode | Descrição |
|---|---|---|---|
| POST | `/pagamentos` | usuário logado (o serviço de Pedidos chama com o token do comprador) | Registrar o pagamento de um pedido → 201 `PENDENTE` |
| GET | `/pagamentos/pedido/:pedidoId` | comprador ou vendedor | Consultar o pagamento do pedido |
| PATCH | `/pagamentos/:id/confirmar` | só o vendedor | `PENDENTE → CONFIRMADO` |
| PATCH | `/pagamentos/:id/cancelar` | comprador ou vendedor | `PENDENTE → CANCELADO` |
| GET | `/health` | qualquer um | Verificação de saúde (sem token) |

Todas as rotas `/pagamentos` exigem `Authorization: Bearer <token>`; o token é validado no serviço de Usuários.
Formato dos dados em [`/docs/API.md`](../../docs/API.md).

## Regras

- Um pedido só pode ter **um** pagamento (409 se tentar registrar de novo; garantido também por índice único no banco).
- O comprador do pagamento é sempre o dono do token; comprador e vendedor não podem ser a mesma pessoa.
- `CONFIRMADO` e `CANCELADO` são finais: pagamento confirmado não cancela, cancelado não volta.
- Confirmar e cancelar ao mesmo tempo: só o primeiro vale, o outro recebe 409 (o `UPDATE` só grava se o status ainda for o esperado).
- Erros: 400 dados inválidos · 401 token · 403 sem permissão · 404 não encontrado · 409 conflito de estado · 503 Usuários fora do ar.

### Por que só essas rotas

Foram criadas só as necessárias ao fluxo: registrar (Pedidos), consultar e confirmar/cancelar (telas de pedidos).
Não há `GET /pagamentos/:id`, listagem geral, edição de valor nem exclusão: a tela sempre consulta pelo pedido,
e valor de um pagamento registrado não deve ser editado nem apagado (fica o histórico).

### Limitação conhecida

O serviço confia nos dados que o Pedidos envia (`valor`, `vendedorId`), como define o contrato do `API.md`, e não consulta o
Pedidos para conferir. Num sistema com dinheiro real isso precisaria ser verificado; aqui, sendo simulado, foi mantido simples.

## Rodando

```bash
cd servicos/pagamentos-service
cp .env.example .env        # ajuste DATABASE_URL e USUARIOS_URL
npm install
npm run dev                 # http://localhost:3002  (cria a tabela sozinho na primeira execução)
npm test                    # testes (não precisam de banco nem dos outros serviços)
```

Com `NODE_ENV=production`, `DATABASE_URL` e `USUARIOS_URL` são obrigatórios.

## Estrutura

```
src/
├── server.js                  composition root: único lugar que escolhe as implementações
├── app.js                     monta o Express
├── config/env.js              variáveis de ambiente
├── erros.js                   todos os erros do serviço (a api traduz cada um para um status HTTP)
├── domain/                    NÚCLEO — JS puro, sem Express/MySQL/HTTP
│   ├── Pagamento.js           entidade: cria, confirma, cancela e diz quem pode
│   └── StatusPagamento.js
├── application/               CASOS DE USO
│   └── PagamentoService.js    registrar, consultar, confirmar, cancelar (contratos/portas descritos no topo)
├── infrastructure/            DETALHES TÉCNICOS — implementam as portas
│   ├── database/pool.js       conexão MySQL + criação da tabela
│   ├── persistence/PagamentoRepositoryMysql.js
│   └── servicosExternos.js    chamada HTTP ao Usuários (GET /auth/validar)
└── api/                       ENTRADA HTTP
    ├── rotas.js               controllers
    ├── validadores.js, dto.js
    └── middlewares/           autenticar (valida token no Usuários), tratadorErros
```

Regra de dependência: `api` e `infrastructure` → `application` → `domain`.
Trocar o pagamento simulado por um gateway real = implementar o contrato descrito em `PagamentoService.js` dentro de `infrastructure` e ligá-la no `server.js`.
