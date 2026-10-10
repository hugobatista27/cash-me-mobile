# TASK-04: Carteira Digital, Saldos Isolados e Extratos de Pontos

- **Responsável:** Engenheiro Mobile (React Native / Expo)
- **Status:** READY
- **Dependências:** TASK-02
- **Relação com Backend:** Tasks #5 e #7 do backend Adonis, ADR-002

---

## 1. Objetivo & Escopo

Desenvolver as telas de acompanhamento financeiro e pontuação do consumidor: a tela inicial (Home) com o resumo consolidado, a tela de Carteira Digital com o saldo acumulado em cada estabelecimento parceiro de forma isolada (ADR-002), a tela de Extrato Detalhado de Movimentações por loja e a tela de Histórico de Notas Fiscais processadas. A solução deve contemplar paginação, estados de carregamento (skeletons), atualização por puxar para atualizar (*pull-to-refresh*) e garantia de preservação do saldo histórico mesmo em lojas inadimplentes (RN05).

---

## 2. Telas e Rotas Correspondentes

- `src/app/(consumer)/(tabs)/index.tsx`: Home do Consumidor:
  - Card de boas-vindas com nome do usuário e pontos totais agregados.
  - Carrossel ou lista rápida dos últimos estabelecimentos onde o usuário pontuou.
  - Atalho central para escanear nova nota fiscal.
  - Histórico recente de lançamentos.
- `src/app/(consumer)/(tabs)/wallet.tsx`: Carteira Digital:
  - Lista de todos os estabelecimentos com saldo ativo (`currentBalance > 0`).
  - Total de pontos acumulados na vida (`totalAccumulated`).
  - Toque no card do estabelecimento abre o extrato detalhado daquela loja.
- `src/app/(consumer)/statement/[id].tsx`: Extrato Detalhado da Loja Selecionada:
  - Cabeçalho com dados da loja (Nome Fantasia, CNPJ).
  - Saldo atual naquela loja específica.
  - Lista cronológica decrescente de movimentações (`CREDIT`, `DEBIT`, `REVERSAL`).
- `src/app/(consumer)/invoice/[id].tsx`: Visualização de detalhes fiscais de uma nota:
  - Valor total da compra em R$.
  - Chave de acesso formatada.
  - Pontos atribuídos.
  - Lista de itens adquiridos (quando extraídos pelo backend).

---

## 3. Endpoints da API do Backend Consumidos

### 3.1. Consulta de Saldos por Estabelecimento
- **Endpoint:** `GET /api/v1/customer/balances`
- **Headers:** `Authorization: Bearer oat_...`
- **Resposta Sucesso (200):**
  ```json
  [
    {
      "id": 1,
      "currentBalance": 350,
      "totalAccumulated": 500,
      "establishment": {
        "id": 5,
        "cnpj": "12345678000195",
        "tradeName": "Padaria Real",
        "status": "ACTIVE"
      }
    },
    {
      "id": 2,
      "currentBalance": 120,
      "totalAccumulated": 120,
      "establishment": {
        "id": 8,
        "cnpj": "98765432000100",
        "tradeName": "Supermercado Central",
        "status": "INACTIVE"
      }
    }
  ]
  ```

### 3.2. Extrato de Transações em uma Loja Específica
- **Endpoint:** `GET /api/v1/customer/establishments/:establishmentId/statement`
- **Headers:** `Authorization: Bearer oat_...`
- **Resposta Sucesso (200):**
  ```json
  [
    {
      "id": 101,
      "type": "CREDIT",
      "points": 150,
      "description": "Pontos gerados por NFC-e",
      "createdAt": "2026-10-10T14:30:00Z"
    },
    {
      "id": 89,
      "type": "CREDIT",
      "points": 200,
      "description": "Pontos gerados por NFC-e",
      "createdAt": "2026-10-05T11:15:00Z"
    }
  ]
  ```

### 3.3. Histórico de Notas Fiscais
- **Endpoint:** `GET /api/v1/customer/invoices`
- **Headers:** `Authorization: Bearer oat_...`
- **Resposta Sucesso (200):**
  ```json
  [
    {
      "id": 42,
      "accessKey": "42230912345678000195650010000001231000001234",
      "totalAmount": 150.00,
      "pointsAwarded": 150,
      "status": "PROCESSED",
      "createdAt": "2026-10-10T14:30:00Z"
    }
  ]
  ```

### 3.4. Detalhes de Nota Fiscal com Itens
- **Endpoint:** `GET /api/v1/customer/invoices/:id`
- **Headers:** `Authorization: Bearer oat_...`
- **Resposta Sucesso (200):**
  ```json
  {
    "id": 42,
    "accessKey": "42230912345678000195650010000001231000001234",
    "totalAmount": 150.00,
    "pointsAwarded": 150,
    "status": "PROCESSED",
    "items": [
      {
        "id": 1,
        "description": "Cafe Especial 250g",
        "quantity": 2,
        "unitPrice": 25.00,
        "totalPrice": 50.00
      }
    ]
  }
  ```

---

## 4. Regras de Negócio Aplicáveis

- **RN05 (Proteção do Direito Adquirido / Inadimplência):** Caso um estabelecimento esteja inativo ou inadimplente (`status === 'INACTIVE'`), o app **não deve** ocultar o saldo nem o histórico do extrato do consumidor. O saldo permanece visível, podendo exibir um badge informativo sutil (ex: "Loja temporariamente inativa para novos pontos").
- **ADR-002 (Isolamento Multi-Tenant Lógico):** Pontos pertencem estritamente ao par Consumidor + Loja. O saldo de uma loja não pode ser somado para resgate em outra loja no MVP. A interface deve deixar claro ao usuário em qual estabelecimento ele possui cada saldo.

---

## 5. Critérios de Aceite

- [ ] Home exibe resumo visual com saudação, total de pontos agregados e atalho de escaneamento.
- [ ] Carteira (`wallet.tsx`) exibe a lista de estabelecimentos com saldos ativos agrupados por loja através de `@shopify/flash-list` ou `FlatList` performática.
- [ ] Implementação de Pull-to-Refresh em todas as listas sincronizada com o TanStack Query.
- [ ] Toque em uma loja da carteira navega para a tela de extrato isolado daquela loja (`/statement/[id]`).
- [ ] Extrato lista lançamentos com tipografia diferenciada: créditos com `+` em verde e débitos com `-` em vermelho/neutro.
- [ ] Exibição adequada de saldos de lojas inativas conforme RN05 (sem ocultação de dados históricos).
- [ ] Estados de carregamento com *skeleton loaders* suaves e tratamento de estado vazio (*Empty State*) quando o usuário ainda não possui notas.
