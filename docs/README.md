# Documentação Técnica Oficial - Cash Me Mobile

Bem-vindo à documentação técnica oficial de engenharia e produto do aplicativo móvel **Cash Me Mobile** (`cash-me-mobile`).

Esta documentação foi elaborada pelo Arquiteto e Planejador de Software Mobile para guiar o desenvolvimento, manutenção e evolução contínua do aplicativo com suporte completo às regras de negócio, contratos de API e identidade visual da plataforma.

---

## 📚 1. Arquitetura e Decisões de Engenharia (`docs/architecture/`)

- **[Visão Geral da Arquitetura (ARCHITECTURE.md)](./architecture/ARCHITECTURE.md):** SDD com visão conceitual, topologia cliente-servidor, pipeline assíncrono (EDD), estrutura de pastas e matriz de conformidade com as regras de negócio (RN01 a RN08).
- **[Roteamento e Proteção por Role (ROUTING-AND-GUARDS.md)](./architecture/ROUTING-AND-GUARDS.md):** Especificação completa do Expo Router v4, Route Groups (`(auth)`, `(consumer)`, `(merchant)`), controle de acesso por papel de usuário e Deep Linking.
- **[Estado, Armazenamento Seguro e Cache (STATE-AND-STORAGE.md)](./architecture/STATE-AND-STORAGE.md):** Gestão de estado do cliente com Zustand, persistência segura com `expo-secure-store`, cache do servidor com TanStack Query e comportamento offline.
- **[Cliente HTTP e Contratos de API (HTTP-CLIENT-AND-API.md)](./architecture/HTTP-CLIENT-AND-API.md):** Configuração do Axios, interceptors de autenticação e erro, catálogo completo de endpoints do backend AdonisJS 6 e tratamento de exceções de negócio.
- **[Diretrizes de UI e Design System (DESIGN-SYSTEM-AND-UI.md)](./architecture/DESIGN-SYSTEM-AND-UI.md):** Paleta de cores oficial (Verde Consumidor, Roxo Lojista, Ouro Pontos), tipografia, safe area e diretrizes extraídas de `cash-me-front`.
- **[Guia Base de Dependências (STACK.md)](./architecture/STACK.md):** Guia de pacotes e setup recomendado do ecossistema Expo.

---

## 📋 2. Backlog e Tarefas Detalhadas de Desenvolvimento (`docs/tasks/`)

- **[Índice do Roadmap e Matriz de Dependências (INDEX.md)](./tasks/INDEX.md)**
- **[TASK-01: Setup do Projeto e Infraestrutura Base](./tasks/TASK-01-SETUP-E-INFRAESTRUTURA.md)**
- **[TASK-02: Autenticação, Armazenamento Seguro e Roles](./tasks/TASK-02-AUTENTICACAO-E-ROLES.md)**
- **[TASK-03: Leitura de QR Code e Processamento de NFC-e](./tasks/TASK-03-LEITURA-QRCODE-E-PROCESSAMENTO-NFCE.md)**
- **[TASK-04: Carteira Digital e Extratos de Pontos do Consumidor](./tasks/TASK-04-CARTEIRA-E-EXTRATO-CONSUMIDOR.md)**
- **[TASK-05: Exploração de Estabelecimentos e Vitrine](./tasks/TASK-05-EXPLORACAO-LOJAS-E-VITRINE.md)**
- **[TASK-06: Interface do Lojista: Regras, Simulador e Versionamento](./tasks/TASK-06-INTERFACE-LOJISTA-REGRAS-E-SIMULADOR.md)**
- **[TASK-07: Perfis de Usuário, Biometria, Termos e Privacidade](./tasks/TASK-07-PERFIL-CONFIGURACOES-E-PRIVACIDADE.md)**
- **[TASK-08: Notificações Push FCM e Deep Linking](./tasks/TASK-08-NOTIFICACOES-PUSH-E-DEEP-LINKING.md)**
- **[TASK-09: Testes Automatizados E2E com Maestro e Qualidade](./tasks/TASK-09-TESTES-E2E-MAESTRO-E-QUALIDADE.md)**
