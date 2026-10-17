# TASK-11: Resgate de Cupons no App Mobile e Débito Atômico

- **Responsável:** Backend Developer (AdonisJS v6) + Mobile Developer (Expo / React Native)
- **Status:** READY (após TASK-10.1)
- **Dependências:** TASK-02, TASK-04, TASK-05, TASK-10
- **Relação com Backend:** [`cash-me/docs/tasks/11-resgate-de-cupons-no-app-mobile-e-debito-atomico.md`](../../../cash-me/docs/tasks/11-resgate-de-cupons-no-app-mobile-e-debito-atomico.md), **RN05**, **RN09**, **RN11**, **ADR-003**

---

## 1. Objetivo & Escopo

Permitir que o Consumidor visualize as recompensas disponíveis em cada estabelecimento parceiro, resgate cupons de desconto com débito atômico imediato protegido por lock pessimista (`SELECT FOR UPDATE`), visualize seus cupons na tela "Meus Cupons" (com código alfanumérico curto e QR Code) e cancele voluntariamente cupons ativos com estorno integral automático (`REVERSAL`). Além disso, bloquear novos resgates caso o lojista esteja com status `INACTIVE` (RN11).

---

## 2. Sub-tarefas Operacionais

### 2.1. Backend (AdonisJS v6 - `cash-me/`)
- **TASK-11.1 (Database & Models):**
  - Criar migration `create_coupon_redemptions_table.ts`:
    - `id` (PK increments)
    - `reward_id` (FK `rewards.id`, unsigned, notNullable)
    - `customer_id` (FK `user_customers.id`, unsigned, notNullable)
    - `establishment_id` (FK `establishments.id`, unsigned, notNullable)
    - `code` (string, 10, unique, notNullable — código alfanumérico de 6 a 8 caracteres em uppercase, ex: `CM7X9K2`)
    - `points_cost` (decimal 10,2, notNullable — snapshot do custo no ato do resgate)
    - `discount_type` (string, notNullable — snapshot `'FIXED_AMOUNT' | 'PERCENTAGE'`)
    - `discount_value` (decimal 10,2, notNullable — snapshot)
    - `min_purchase_amount` (decimal 10,2, default 0)
    - `max_discount_amount` (decimal 10,2, nullable)
    - `status` (string: `'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED'`, default `'ACTIVE'`)
    - `expires_at` (timestamp, notNullable)
    - `used_at` (timestamp, nullable)
    - `used_by_user_id` (FK `users.id`, unsigned, nullable)
    - `cancelled_at` (timestamp, nullable)
    - `created_at`, `updated_at`
    - Índices: `unique(['code'])`, `index(['status', 'expires_at'])`, `index(['customer_id', 'status'])`, `index(['establishment_id', 'code'])`
  - Criar migration `add_coupon_redemption_fk_to_point_transactions_table.ts` adicionando `coupon_redemption_id` (nullable FK para `coupon_redemptions.id`).
  - Criar Model Lucid `app/models/coupon_redemption.ts` e `app/transformers/coupon_redemption_transformer.ts`.
- **TASK-11.2 (Serviço Transacional Anti-Fraude - `CouponRedemptionService`):**
  - `redeemReward(customer, rewardId)`:
    - Inicia transação `db.transaction()`.
    - Busca `Reward` com `forUpdate()` e `Establishment`.
    - Valida se `establishment.status === 'ACTIVE'` (se `INACTIVE`, lança `EstablishmentInactiveException` - RN11).
    - Valida se `reward.status === 'ACTIVE'` e `reward.stock === null || reward.stock > 0`.
    - Busca `PointBalance` do par `(customer.id, establishment.id)` com `.forUpdate()`.
    - Valida `balance.currentBalance >= reward.pointsCost` (se insuficiente, lança `InsufficientPointsException`).
    - Decrementa `balance.currentBalance -= reward.pointsCost` (sem alterar `totalAccumulated`).
    - Se `reward.stock !== null`, decrementa `reward.stock -= 1`.
    - Gera código alfanumérico único de 7 caracteres (`crypto.randomBytes`) e cria registro em `coupon_redemptions` com `status = 'ACTIVE'` e `expires_at = DateTime.now().plus({ days: reward.validityDays })`.
    - Cria registro em `point_transactions` com `type = 'DEBIT'`, `points = -reward.pointsCost` (ou valor absoluto conforme convenção do extrato), `couponRedemptionId = coupon.id` e `description = "Resgate de cupom: ${reward.title}"`.
  - `cancelCoupon(customer, couponId)`:
    - Inicia transação `db.transaction()`.
    - Busca `CouponRedemption` com `.forUpdate()` garantindo `customer_id === customer.id`.
    - Valida se `status === 'ACTIVE'` e `expires_at > now()`.
    - Busca `PointBalance` com `.forUpdate()`.
    - Atualiza cupom: `status = 'CANCELLED'`, `cancelledAt = DateTime.now()`.
    - Devolve estoque à `Reward` (`stock += 1` se não nulo).
    - Estorna saldo: `balance.currentBalance += coupon.pointsCost`.
    - Insere `point_transactions` com `type = 'REVERSAL'`, `points = coupon.pointsCost`, `couponRedemptionId = coupon.id`, `description = "Estorno de cupom cancelado: ${coupon.code}"`.
- **TASK-11.3 (Controller & Rotas do Consumidor):**
  - Criar `app/controllers/customer_coupons_controller.ts`:
    - `GET /api/v1/customer/establishments/:id/rewards`: Lista recompensas `ACTIVE` e com estoque disponível daquela loja.
    - `POST /api/v1/customer/rewards/:id/redeem`: Executa o resgate atômico.
    - `GET /api/v1/customer/coupons`: Lista todos os cupons do consumidor (`ACTIVE`, `USED`, `CANCELLED`, `EXPIRED`).
    - `GET /api/v1/customer/coupons/:id`: Detalhes do cupom com QR Code payload.
    - `POST /api/v1/customer/coupons/:id/cancel`: Cancela voluntariamente cupom `ACTIVE` e estorna pontos.
- **TASK-11.4 (Testes de Concorrência e Double Spending):**
  - Testes funcionais disparando `Promise.all` com 5 requisições simultâneas de resgate para um cliente com saldo suficiente para apenas 1 cupom, provando que exatamente 1 sucede (`201`) e 4 falham (`400/422`), nunca deixando `current_balance < 0`.

### 2.2. Mobile (Expo / React Native - `cash-me-mobile/`)
- **TASK-11.5 (Services & Hooks Mobile):**
  - Criar `src/services/coupons.service.ts` e `src/hooks/useCoupons.ts` (queries `['customer', 'rewards', establishmentId]`, `['customer', 'coupons']` e mutations `useRedeemReward`, `useCancelCoupon` invalidando `['customer', 'balances']`, `['customer', 'statement']` e `['customer', 'coupons']`).
- **TASK-11.6 (Telas do Consumidor no App):**
  - Atualizar `src/app/(consumer)/store/[id].tsx`: Exibir seção "Recompensas e Cupons Disponíveis", botão "Resgatar por X pts" e banner de bloqueio se a loja estiver `INACTIVE` (RN11).
  - Criar `src/app/(consumer)/coupons/index.tsx` e/ou integrar aba/atalho "Meus Cupons" na Carteira (`wallet.tsx`):
    - Filtro por abas: `Ativos`, `Utilizados`, `Expirados/Cancelados`.
  - Criar `src/app/(consumer)/coupons/[id].tsx`:
    - Exibição do QR Code vetorial e código alfanumérico em destaque (`CM7X9K2`), data de validade, regras de uso e botão "Cancelar e Estornar Pontos" (visível se `status === 'ACTIVE'`).

---

## 3. Critérios de Aceite

- [ ] Transação de resgate usa `SELECT FOR UPDATE` e impede *Double Spending* sob concorrência.
- [ ] Bloqueio de novos resgates em estabelecimentos com `status === 'INACTIVE'`, mantendo visualização de saldo e cupons antigos (RN11).
- [ ] Cancelamento voluntário pelo app devolve imediatamente os pontos ao saldo (`REVERSAL`) e atualiza o extrato.
- [ ] Testes unitários (Jest) no mobile e funcionais (Japa) no backend passando 100%.
