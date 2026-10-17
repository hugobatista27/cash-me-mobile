# TASK-10: Gestão de Recompensas e Catálogo de Cupons (Backend, Mobile Lojista & Admin Web)

- **Responsável:** Backend Developer (AdonisJS v6) + Mobile Developer (Expo / React Native)
- **Status:** READY
- **Dependências:** TASK-01, TASK-02, Task #01 (Backend)
- **Relação com Backend:** [`cash-me/docs/tasks/10-gestao-de-recompensas-e-catalogo-de-cupons.md`](../../../cash-me/docs/tasks/10-gestao-de-recompensas-e-catalogo-de-cupons.md), **RN09**, **ADR-002**

---

## 1. Objetivo & Escopo

Permitir que o Lojista crie, edite, ative/desative e consulte o catálogo de recompensas (cupons de desconto em valor fixo `R$` ou percentual `%`). A API AdonisJS v6 deve prover o modelo de dados `rewards` e os endpoints REST protegidos com isolamento estrito por tenant (`establishment_id` - ADR-002). No aplicativo mobile (`cash-me-mobile`) e/ou Painel Admin, o lojista dispõe da tela de gerenciamento de recompensas em `/(merchant)/rewards` para administrar suas ofertas.

---

## 2. Sub-tarefas Operacionais

### 2.1. Backend (AdonisJS v6 - `cash-me/`)
- **TASK-10.1 (Database & Model):**
  - Criar migration `create_rewards_table.ts` com colunas:
    - `id` (PK increments)
    - `establishment_id` (FK `establishments.id`, unsigned, notNullable, CASCADE)
    - `title` (string, 120, notNullable)
    - `description` (text, nullable)
    - `discount_type` (enum/string: `'FIXED_AMOUNT' | 'PERCENTAGE'`, notNullable)
    - `discount_value` (decimal 10,2, notNullable)
    - `min_purchase_amount` (decimal 10,2, default 0.00)
    - `max_discount_amount` (decimal 10,2, nullable — obrigatório quando `PERCENTAGE`)
    - `points_cost` (decimal 10,2, notNullable)
    - `stock` (integer, nullable — `null` = estoque ilimitado)
    - `validity_days` (integer, notNullable, default 7)
    - `status` (string: `'ACTIVE' | 'INACTIVE' | 'ARCHIVED'`, default `'ACTIVE'`)
    - `created_at`, `updated_at`
    - Índices: `index(['establishment_id', 'status'])`
  - Criar Model Lucid `app/models/reward.ts` e `app/transformers/reward_transformer.ts`.
- **TASK-10.2 (Validators & Service):**
  - Criar `app/validators/reward_validator.ts` validando:
    - `pointsCost > 0`, `discountValue > 0`, `validityDays >= 1`
    - Se `discountType === 'PERCENTAGE'`, exigir `discountValue <= 100` e `maxDiscountAmount > 0`.
- **TASK-10.3 (Controller & Routes Multi-Tenant):**
  - Criar `app/controllers/establishment_rewards_controller.ts` com endpoints sob `/api/v1/establishment/rewards` (e alias `/api/v1/establishments/rewards`):
    - `GET /`: Lista recompensas do `establishment_id` do lojista autenticado.
    - `POST /`: Cria recompensa vinculada ao `establishment_id` do lojista (`LOJISTA_ADMIN`).
    - `PUT /:id`: Atualiza recompensa garantindo que pertence ao tenant autenticado.
    - `PATCH /:id/status`: Altera status entre `'ACTIVE'`, `'INACTIVE'` e `'ARCHIVED'`.
- **TASK-10.4 (Testes Backend TDD):**
  - Testes funcionais Japa (`tests/functional/establishment_rewards.spec.ts`) validando criação, regras de negócio e isolamento multi-tenant (um lojista A jamais acessa ou altera recompensas do lojista B).

### 2.2. Mobile / Frontend (`cash-me-mobile/`)
- **TASK-10.5 (Service & Hooks):**
  - Criar `src/services/merchantRewards.ts` e hook `src/hooks/useMerchantRewards.ts` (TanStack Query: query key `['merchant', 'rewards']`).
- **TASK-10.6 (Telas do Lojista):**
  - Adicionar seção/tela em `src/app/(merchant)/(tabs)/rewards.tsx` (ou atalho no Dashboard do Lojista) com listagem de cupons cadastrados, chave de ativação rápida (`ACTIVE`/`INACTIVE`) e modal/formulário de criação/edição.

---

## 3. Contratos de Endpoints

| Método | Endpoint | Role | Payload / Query | Resposta |
|---|---|---|---|---|
| `GET` | `/api/v1/establishment/rewards` | `LOJISTA_*` | `?status=ACTIVE` (opcional) | `200 OK` - Lista de `Reward` |
| `POST` | `/api/v1/establishment/rewards` | `LOJISTA_ADMIN` | `{ title, description, discountType, discountValue, minPurchaseAmount, maxDiscountAmount, pointsCost, stock, validityDays }` | `201 Created` - `Reward` |
| `PUT` | `/api/v1/establishment/rewards/:id` | `LOJISTA_ADMIN` | Campos editáveis da recompensa | `200 OK` - `Reward` |
| `PATCH` | `/api/v1/establishment/rewards/:id/status` | `LOJISTA_ADMIN` | `{ status: 'ACTIVE' \| 'INACTIVE' \| 'ARCHIVED' }` | `200 OK` - `Reward` |

---

## 4. Critérios de Aceite

- [ ] Migration e Model `Reward` executando sem erros.
- [ ] Validação bloqueando `points_cost <= 0`, `discount_value <= 0`, `validity_days < 1` ou desconto percentual sem `max_discount_amount`.
- [ ] Isolamento multi-tenant 100% coberto por testes de integração no backend (ADR-002).
- [ ] Interface do Lojista permitindo criar, editar e alternar status de recompensas com atualização otimista no TanStack Query.
