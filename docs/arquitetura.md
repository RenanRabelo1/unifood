# UniFood — Arquitetura

## Visão geral

```
                         ┌──────────────────────┐
                         │  Frontend (React)    │
                         └──────────┬───────────┘
        ┌─────────────────┬─────────┴─────────┬──────────────────┐
        ▼                 ▼                   ▼                  ▼
 ┌─────────────┐   ┌─────────────┐     ┌─────────────┐    ┌──────────────┐
 │  Usuários   │◄──│  Produtos   │◄────│   Pedidos   │───►│  Pagamentos  │
 │ Java/Spring │   │ Java/Spring │     │ Node/Express│    │ Node/Express │
 └──────┬──────┘   └──────┬──────┘     └──────┬──────┘    └──────┬───────┘
        │                 │                   │                  │
   MongoDB            MongoDB              MySQL              MySQL
  usuarios_db        produtos_db         pedidos_db        pagamentos_db

 Produtos, Pedidos e Pagamentos validam o token em Usuários (GET /auth/validar).
 Pedidos busca preço/bloco em Produtos e cria o pagamento em Pagamentos.
```

Cada microserviço tem **seu próprio banco** e só conversa com os outros por **HTTP/REST**.

## Camadas de cada serviço Java (Clean Architecture simplificada)

```
src/main/java/unifood/
├── UsuariosApplication.java      # bootstrap do Spring
├── config/                       # CORS, propriedades (JWT)
├── domain/                       # NÚCLEO — Java puro, sem Spring/Mongo/HTTP
│   ├── model/                    #   entidades com comportamento (Usuario, Produto)
│   └── exception/                #   violações de regra de negócio
├── application/                  # CASOS DE USO
│   ├── port/                     #   interfaces que a aplicação precisa (repositório, token, gateway)
│   ├── service/                  #   orquestração dos casos de uso
│   └── exception/                #   falhas de aplicação (não autenticado, serviço indisponível)
├── infrastructure/               # DETALHES TÉCNICOS — implementam as portas
│   ├── persistence/              #   MongoDB (Document + Spring Data + Adapter)
│   ├── security/                 #   BCrypt, JWT            (usuarios)
│   └── client/                   #   HTTP para Usuários     (produtos)
└── api/                          # ENTRADA HTTP
    ├── controller/               #   rotas REST
    ├── dto/                      #   formatos de request/response
    ├── auth/                     #   @UsuarioLogado         (produtos)
    └── handler/                  #   exceção → status HTTP
```

Regra de dependência: `api` e `infrastructure` → `application` → `domain`. O domínio não depende de ninguém.

## SOLID aplicado

| Princípio | Onde |
|---|---|
| **S** — Responsabilidade única | `UsuarioService` (cadastro/consulta) separado de `AutenticacaoService` (login/token); controllers só traduzem HTTP; `GlobalExceptionHandler` é o único que converte erro em status; `UsuarioLogadoResolver` é o único que autentica nas rotas de Produtos. |
| **O** — Aberto/fechado | Trocar BCrypt, JWT ou MongoDB = criar nova classe que implementa a porta (`CodificadorSenha`, `ProvedorToken`, `ProdutoRepository`), sem alterar os casos de uso. |
| **L** — Substituição de Liskov | Os testes trocam os adapters reais por implementações em memória e os serviços funcionam igual. |
| **I** — Segregação de interfaces | Portas pequenas e específicas: `CodificadorSenha`, `ProvedorToken`, `UsuarioRepository`, `AutenticacaoGateway`. O domínio só enxerga `SenhaConferidor` (um método). |
| **D** — Inversão de dependência | Serviços dependem de interfaces em `application/port`; as implementações ficam em `infrastructure` e são injetadas pelo Spring. |

## GRASP aplicado

| Padrão | Onde |
|---|---|
| **Information Expert** | `Produto.garantirDono()` (só o dono altera), `Usuario.senhaConfere()`, `Usuario.normalizarEmail()`. |
| **Creator** | `Usuario.novo(...)`, `Produto.novo(dados, vendedor)`. |
| **Controller** | `UsuarioService`, `AutenticacaoService`, `ProdutoService` coordenam cada caso de uso. |
| **Low Coupling** | Serviços não conhecem MongoDB nem HTTP; microserviços só se conhecem pela URL. |
| **High Cohesion** | Um pacote por responsabilidade; um service por grupo de casos de uso. |
| **Pure Fabrication / Indirection** | `*RepositoryMongoAdapter`, `UsuariosHttpGateway`, `JwtProvedorToken`, `UsuarioLogadoResolver`. |
| **Protected Variations** | Portas protegem o núcleo de mudanças de banco, algoritmo de hash ou do serviço de Usuários. |

## Frontend

```
frontend/src/
├── config/servicos.js        # URL de cada microserviço
├── services/                 # 1 módulo por microserviço + cliente HTTP comum (token, erros)
├── hooks/                    # useAuth, useNotificacao
├── pages/                    # Login, Vitrine, Meus produtos, Pedidos
├── components/               # layout/, ui/, produtos/, pedidos/
├── utils/                    # formatadores
└── styles/
```
