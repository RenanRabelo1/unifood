# UniFood

Marketplace de lanches entre alunos do campus: um aluno cadastra produtos com o bloco de retirada,
outro aluno faz o pedido, escolhe entrega ou retirada e registra o pagamento.

Arquitetura de microserviços — cada serviço tem seu próprio banco de dados.
Contrato completo das rotas: [`docs/API.md`](docs/API.md).

| Serviço | Pasta | Linguagem | Banco | Integrante |
|---|---|---|---|---|
| Usuários | `usuarios-service/` | Java 17 + Spring Boot | MongoDB `usuarios_db` | Renan |
| Produtos | `produtos-service/` | Java 17 + Spring Boot | MongoDB `produtos_db` | Renan |
| Pedidos | `pedidos-service/` | Node.js + Express | MySQL `pedidos_db` | (colega) |
| Pagamentos | `pagamentos-service/` | Node.js + Express | MySQL `pagamentos_db` | (colega) |
| Frontend | `frontend/` | React (Vite) | — | Renan |

```
            Frontend (React)
   ┌─────────┬──────┴─────┬──────────────┐
   ▼         ▼            ▼              ▼
Usuários ◄─ Produtos ◄── Pedidos ──────► Pagamentos
   ▲  valida token   busca produto   cria pagamento
   └─────────────── valida token ─────────┘
```

## Rodando localmente

Pré-requisitos: Java 17, Maven, Node 18+, MongoDB (local ou Atlas).

```bash
# Usuários (porta 8081)
cd usuarios-service && MONGODB_URI="mongodb://localhost:27017/usuarios_db" mvn spring-boot:run
# Produtos (porta 8082)
cd produtos-service && MONGODB_URI="mongodb://localhost:27017/produtos_db" USUARIOS_URL=http://localhost:8081 mvn spring-boot:run
# Frontend (porta 5173)
cd frontend && cp .env.example .env && npm install && npm run dev
```

## Implantação na nuvem

- **Bancos MongoDB:** MongoDB Atlas (cluster gratuito), bancos `usuarios_db` e `produtos_db`.
- **Serviços Java:** Render (Docker), via `render.yaml` (Blueprint).
- **Frontend:** Vercel, pasta `frontend/`, com as variáveis `VITE_*_URL` apontando para os serviços no Render.
