# TASK-09: Testes Automatizados E2E com Maestro e Garantia de Qualidade

- **Responsável:** Engenheiro Mobile (React Native / Expo)
- **Status:** READY
- **Dependências:** TASK-02, TASK-03, TASK-04, TASK-06
- **Relação com Backend:** Validação de ponta a ponta dos fluxos críticos

---

## 1. Objetivo & Escopo

Configurar a suíte de testes de ponta a ponta (*End-to-End* - E2E) do aplicativo mobile utilizando a ferramenta **Maestro** (`maestro.mobile.dev`). O escopo inclui a criação de cenários de teste automatizados e declarativos em arquivos YAML cobrindo:
1. Fluxo de cadastro e login de consumidor.
2. Fluxo de login de lojista e verificação de regras/simulador.
3. Fluxo de leitura/digitação manual de nota fiscal NFC-e com validação de cômputo de pontos e extrato.
4. Validação de bloqueio de rotas por role (garantia de que consumidor não acessa rotas de lojista).
5. Configuração de script de execução e checklist para homologação de releases.

---

## 2. Estrutura de Arquivos de Teste E2E

```
cash-me-mobile/
└── e2e/
    ├── config.yaml                     # Configurações globais do Maestro (appId, timeouts)
    ├── flows/
    │   ├── 01-auth-consumer.yaml       # Cadastro e Login de Consumidor
    │   ├── 02-auth-merchant.yaml       # Login de Lojista e Dashboard
    │   ├── 03-scan-and-points.yaml     # Digitação de chave de 44 dígitos e cômputo de pontos
    │   ├── 04-wallet-and-statement.yaml# Navegação por saldos e visualização de extrato
    │   ├── 05-merchant-rules.yaml      # Simulação e alteração de regras de fidelidade
    │   └── 06-role-guards-security.yaml# Tentativa de acesso indevido e redirecionamento
    └── scripts/
        └── run-e2e.sh                  # Script helper para disparo de testes no emulador local
```

---

## 3. Exemplos de Cenários Declarativos do Maestro

### 3.1. Fluxo de Autenticação e Consulta de Saldo (`01-auth-consumer.yaml`)
```yaml
appId: app.cashme.mobile
---
- launchApp
- assertVisible: "Entrar"
- tapOn: "E-mail"
- inputText: "maria@example.com"
- tapOn: "Senha"
- inputText: "password123"
- tapOn: "Entrar"
- assertVisible: "Seus Pontos"
- assertVisible: "Carteira"
```

### 3.2. Fluxo de Submissão de NFC-e (`03-scan-and-points.yaml`)
```yaml
appId: app.cashme.mobile
---
- tapOn: "Escanear"
- tapOn: "Digitar chave manualmente"
- assertVisible: "Chave de Acesso da NFC-e"
- tapOn: "Chave de Acesso"
- inputText: "42230912345678000195650010000001231000001234"
- tapOn: "Enviar Nota"
- assertVisible: "Pontos Creditados!"
- tapOn: "Ver Extrato"
- assertVisible: "Pontos gerados por NFC-e"
```

### 3.3. Fluxo de Simulação de Regras do Lojista (`05-merchant-rules.yaml`)
```yaml
appId: app.cashme.mobile
---
- tapOn: "Regras"
- assertVisible: "Regra Ativa"
- tapOn: "Valor da Compra"
- inputText: "200.00"
- assertVisible: "Pontos calculados:"
- tapOn: "Histórico de Versões"
- assertVisible: "Versão 1"
```

---

## 4. Regras de Negócio Testadas no E2E

- **RN01 / RN02 / RN07:** O fluxo E2E valida se chaves duplicadas ou fora do padrão exibem os alertas adequados na interface.
- **RN04:** O simulador na tela do lojista calcula exatamente a pontuação esperada conforme o fator configurado.
- **Proteção por Papel:** Verificação de que um consumidor autenticado é impedido de acessar rotas privativas de lojista.

---

## 5. Critérios de Aceite

- [ ] Maestro instalado e configurado para executar com o `appId` oficial (`app.cashme.mobile`).
- [ ] Cenários declarativos em YAML cobrindo os 6 fluxos descritos na seção 2.
- [ ] Execução bem-sucedida do script `npm run test:e2e` contra um emulador Android ou iOS local.
- [ ] Testes de regressão cobrindo o fluxo crítico: Login -> Entrada de Nota -> Confirmação de Pontos -> Atualização de Saldo.
- [ ] Checklist de qualidade de release documentado em `cash-me-mobile/docs/tasks/`.
