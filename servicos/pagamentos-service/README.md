# pagamentos-service — Node.js (Express) + MySQL

> **A fazer pelo colega.** Rotas e formato dos dados: [`docs/API.md`](../../docs/API.md).

- Porta local: **3002**
- Banco próprio: MySQL `pagamentos_db`
- Variáveis de ambiente: `DATABASE_URL, USUARIOS_URL, PORT`

Estrutura sugerida (mesmas camadas dos serviços Java, para manter a arquitetura uniforme):

```
pagamentos-service/
├── src/
│   ├── server.js            # sobe o Express (bootstrap)
│   ├── config/              # env, conexão MySQL, CORS
│   ├── domain/              # regras de negócio puras (status, cálculo de total...)
│   ├── application/         # casos de uso (services) — dependem de "ports", não do MySQL
│   ├── infrastructure/
│   │   ├── database/        # repositórios MySQL
│   │   └── clients/         # usuariosClient.js
│   └── api/
│       ├── routes/          # definição das rotas
│       ├── controllers/     # recebe req, chama service, devolve res
│       └── middlewares/     # autenticação (GET /auth/validar), tratamento de erros
├── Dockerfile
├── package.json
└── README.md
```
