# RESOLVA — Plataforma de Gestão de Serviços Técnicos

## Visão geral
Plataforma para gerir pedidos, orçamentos, técnicos, agendamentos e conclusão de serviços.

## Perfis principais
- Administrador/Operador
- Técnico
- Cliente

## MVP
- Autenticação de clientes, técnicos e administrador
- Criação de pedido de serviço
- Categorias/especialidades
- Criação e aceitação de orçamento
- Gestão de disponibilidade
- Atribuição de técnico
- Agendamento
- Atualização de estado do serviço
- Registo de pagamento pendente/pago

## Backlog inicial sugerido
- **US01 — Implementar autenticação:** Como utilizador, quero iniciar sessão para aceder ao meu painel.
- **US02 — Criar pedido de serviço:** Como cliente, quero solicitar um serviço e indicar descrição e morada.
- **US03 — Gerir categorias:** Como administrador, quero gerir categorias de serviços.
- **US04 — Criar orçamento:** Como administrador, quero criar e enviar um orçamento ao cliente.
- **US05 — Aceitar orçamento:** Como cliente, quero aceitar ou rejeitar um orçamento.
- **US06 — Gerir técnicos:** Como administrador, quero associar técnicos a especialidades.
- **US07 — Agendar serviço:** Como administrador, quero atribuir técnico, data e hora sem conflito.
- **US08 — Concluir serviço:** Como técnico, quero atualizar o estado e concluir um serviço.

## Entidades iniciais a analisar
`users`, `clients`, `technicians`, `specialties`, `technician_specialties`, `service_requests`, `quotes`, `appointments`, `service_status_history`, `payments`

## Estrutura
```text
equipa2_resolva/
├── frontend/
├── backend/
├── database/
├── docs/
├── tests/
├── .github/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── .gitignore
```

## Fluxo obrigatório
Problema → Análise → Requisitos → Backlog → Issue → Branch → Desenvolvimento → Commit + Push → Pull Request → Code Review → Merge → Teste → Entrega

## Regra de ouro
Nenhum desenvolvimento relevante deve começar sem uma Issue associada.

## Equipa
| Nome | Papel inicial | GitHub |
|---|---|---|
| | | |
| | | |
| | | |

## Tecnologias
A definir pela equipa e aprovar com o professor.
