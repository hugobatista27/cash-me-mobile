# TASK-06: Interface do Lojista: Gestão de Regras de Pontos e Simulador

- **Responsável:** Engenheiro Mobile (React Native / Expo)
- **Status:** READY
- **Dependências:** TASK-02
- **Relação com Backend:** Task #6 do backend Adonis, documento `SISTEMA-DE-PONTOS-E-REGRAS.md`

---

## 1. Objetivo & Escopo

Implementar a interface dedicada do Lojista (`(merchant)`) focada na gestão de sua política de fidelidade. O lojista deve ser capaz de visualizar a regra de conversão de pontos ativa de seu estabelecimento, simular instantaneamente o cálculo de pontos para diferentes tíquetes médios de compra via `GET /establishment/loyalty-rule/simulate`, atualizar e versionar a regra criando uma nova versão imutável via `PUT /establishment/loyalty-rule`, e consultar a trilha auditável de histórico de regras anteriores via `GET /establishment/loyalty-rule/history`.

---

## 2. Telas e Rotas Correspondentes

- `src/app/(merchant)/(tabs)/index.tsx`: Dashboard do Lojista:
  - Resumo da regra ativa (ex: "1 ponto a cada R$ 1,00").
  - Versão atual da regra (ex: "Versão 2").
  - Atalhos rápidos para o simulador e para edição da regra.
- `src/app/(merchant)/(tabs)/rules.tsx`: Tela de Gestão e Simulação de Regras:
  - Card da Regra Ativa com frase humana gerada pelo backend (`humanReadableSummary`).
  - Painel Interativo de Simulação: Campo para valor de compra (`R$ 0,00`) e resultado instantâneo dos pontos calculados.
  - Formulário de Edição / Publicação de Nova Regra (seleção de base monetária, pontos por base, valor mínimo de compra e teto de pontos por compra).
- `src/app/(merchant)/rules/history.tsx`: Histórico Versionado de Regras:
  - Lista cronológica decrescente das versões anteriores com data, autor e status (`ACTIVE` vs `INACTIVE`).

---

## 3. Endpoints da API do Backend Consumidos

### 3.1. Consulta da Regra Ativa
- **Endpoint:** `GET /api/v1/establishment/loyalty-rule`
- **Headers:** `Authorization: Bearer oat_...`
- **Permissão:** `LOJISTA_ADMIN`, `LOJISTA_OPERADOR`
- **Resposta Sucesso (200):**
  ```json
  {
    "id": 1,
    "version": 1,
    "name": "Regra Base Inicial",
    "baseAmount": 10.00,
    "pointsPerBase": 1,
    "minPurchaseAmount": 0.00,
    "maxPointsPerPurchase": 500,
    "status": "ACTIVE",
    "humanReadableSummary": "A cada R$ 10,00 você ganha 1 ponto."
  }
  ```

### 3.2. Simulação em Tempo Real
- **Endpoint:** `GET /api/v1/establishment/loyalty-rule/simulate?amount=150.00`
- **Headers:** `Authorization: Bearer oat_...`
- **Permissão:** `LOJISTA_ADMIN`, `LOJISTA_OPERADOR`
- **Resposta Sucesso (200):**
  ```json
  {
    "purchaseAmount": 150.00,
    "calculatedPoints": 15,
    "ruleApplied": {
      "baseAmount": 10.00,
      "pointsPerBase": 1,
      "minPurchaseAmount": 0.00,
      "maxPointsPerPurchase": 500
    },
    "humanReadableSummary": "A cada R$ 10,00 você ganha 1 ponto."
  }
  ```

### 3.3. Publicação e Versionamento de Nova Regra
- **Endpoint:** `PUT /api/v1/establishment/loyalty-rule`
- **Headers:** `Authorization: Bearer oat_...`
- **Permissão:** Exclusivo para `LOJISTA_ADMIN`
- **Payload:**
  ```json
  {
    "baseAmount": 5.00,
    "pointsPerBase": 1,
    "minPurchaseAmount": 10.00,
    "maxPointsPerPurchase": 1000,
    "name": "1 ponto a cada R$ 5 acima de R$ 10"
  }
  ```
- **Resposta Sucesso (200):**
  ```json
  {
    "id": 2,
    "version": 2,
    "name": "1 ponto a cada R$ 5 acima de R$ 10",
    "baseAmount": 5.00,
    "pointsPerBase": 1,
    "minPurchaseAmount": 10.00,
    "maxPointsPerPurchase": 1000,
    "status": "ACTIVE",
    "humanReadableSummary": "A cada R$ 5,00 você ganha 1 ponto (compra mínima de R$ 10,00)."
  }
  ```

### 3.4. Histórico de Versões da Regra
- **Endpoint:** `GET /api/v1/establishment/loyalty-rule/history`
- **Headers:** `Authorization: Bearer oat_...`
- **Resposta Sucesso (200):**
  ```json
  [
    { "id": 2, "version": 2, "name": "Regra v2", "status": "ACTIVE", "baseAmount": 5.00, "pointsPerBase": 1 },
    { "id": 1, "version": 1, "name": "Regra Base Inicial", "status": "INACTIVE", "baseAmount": 10.00, "pointsPerBase": 1 }
  ]
  ```

---

## 4. Regras de Negócio Aplicáveis

- **RN04 (Regra de Cômputo Personalizável):** O lojista personaliza a pontuação livremente. A alteração nunca recalcula compras ou notas já processadas no passado (princípio de imutabilidade de extrato).
- **Versionamento Imutável:** Cada edição cria uma nova linha na tabela `point_rules` com `version + 1`, marcando a anterior como `INACTIVE`.
- **Controle de Acesso por Papel:** Apenas usuários com `role === 'LOJISTA_ADMIN'` podem salvar/publicar alterações (`PUT`). Usuários com `role === 'LOJISTA_OPERADOR'` podem visualizar e simular, mas o botão de salvar deve ser desabilitado ou ocultado.

---

## 5. Critérios de Aceite

- [ ] Tela de regras (`rules.tsx`) estilizada no tema do lojista (Roxo `#6F35B5`).
- [ ] Card da regra ativa exibe a frase humana oficial retornada pelo backend (`humanReadableSummary`).
- [ ] Simulador interativo: digitação de um valor em R$ calcula os pontos instantaneamente com debounce de 300ms chamando o endpoint de simulação.
- [ ] Formulário de edição valida regras lógicas (ex: `baseAmount > 0`, `pointsPerBase >= 1`).
- [ ] Salvamento de nova regra invalida o cache de `['merchant', 'loyalty-rule']` e `['merchant', 'loyalty-rule', 'history']`.
- [ ] Exibição da tela de histórico (`history.tsx`) listando todas as versões anteriores com badges de status (`Ativa` / `Inativa`).
- [ ] Verificação de permissão: `LOJISTA_OPERADOR` visualiza o simulador em modo somente leitura.
