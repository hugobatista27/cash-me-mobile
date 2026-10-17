# TASK-13: Worker de Expiração e Estorno Automático de Cupons

- **Responsável:** Backend Developer (AdonisJS v6) + QA / Mobile Integration
- **Status:** BACKLOG (Depende de TASK-11.1 e TASK-11.2)
- **Dependências:** TASK-08, TASK-11
- **Relação com Backend:** [`cash-me/docs/tasks/13-worker-de-expiracao-e-estorno-automatico-de-cupons.md`](../../../cash-me/docs/tasks/13-worker-de-expiracao-e-estorno-automatico-de-cupons.md), **RN09**, **ADR-001**, **ADR-003**

---

## 1. Objetivo & Escopo

Implementar o worker/scheduler assíncrono no backend AdonisJS v6 responsável por varrer periodicamente cupons com `status = 'ACTIVE'` e `expires_at < now()`, transicioná-los de forma atômica e idempotente para `EXPIRED`, estornar integralmente os pontos ao saldo disponível do consumidor (`point_balances.current_balance += points_cost`), registrar a movimentação `REVERSAL` no extrato (`point_transactions`) e disparar notificação push FCM avisando o consumidor que seus pontos foram devolvidos.

---

## 2. Sub-tarefas Operacionais

### 2.1. Backend (AdonisJS v6 - `cash-me/`)
- **TASK-13.1 (Serviço de Expiração em Lote Idempotente):**
  - Adicionar método `expireOverdueCoupons()` em `CouponRedemptionService`:
    - Busca em lote (chunks de 100) usando o índice composto `(status, expires_at)`:
      `CouponRedemption.query().where('status', 'ACTIVE').where('expiresAt', '<', DateTime.now().toSQL())`
    - Para cada cupom elegível, abre transação individual `db.transaction()`:
      - Executa `SELECT ... FOR UPDATE SKIP LOCKED` no cupom e verifica novamente `coupon.status === 'ACTIVE'` (garantindo idempotência absoluta caso múltiplos workers rodem em paralelo).
      - Executa `SELECT ... FOR UPDATE` em `point_balances` do par `(customerId, establishmentId)`.
      - Atualiza `coupon.status = 'EXPIRED'` e `coupon.cancelledAt = DateTime.now()`.
      - Devolve estoque à `Reward` (`stock += 1` se não nulo).
      - Incrementa `balance.currentBalance += coupon.pointsCost`.
      - Insere registro em `point_transactions` com `type = 'REVERSAL'`, `points = coupon.pointsCost`, `couponRedemptionId = coupon.id` e `description = "Estorno automático por expiração do cupom ${coupon.code}"`.
      - Emite evento/notificação push para o `deviceToken` do consumidor informando o estorno.
- **TASK-13.2 (Comando Ace & Scheduler):**
  - Criar comando Ace `commands/expire_coupons.ts` (`node ace coupons:expire`) para execução via cron/scheduler e para acionamento determinístico em testes E2E.
- **TASK-13.3 (Testes Automatizados de Idempotência e Lote):**
  - Testes funcionais Japa criando cupons com `expires_at` no passado, executando o worker 2 vezes consecutivas (e também de forma concorrente com `Promise.all`) e comprovando que o saldo é estornado **exatamente uma única vez** e que o extrato contém apenas 1 lançamento `REVERSAL`.

### 2.2. Mobile (`cash-me-mobile/`)
- **TASK-13.4 (Exibição de Estornos no Extrato e Push Handler):**
  - Garantir que o componente de Extrato (`src/app/(consumer)/statement/[id].tsx`) renderize lançamentos `type === 'REVERSAL'` com badge/ícone de estorno (`+X pts` em verde/azul com legenda *"Estorno de cupom"*).
  - No handler de push (`TASK-08`), tratar `data.type === 'COUPON_EXPIRED_REVERSAL'` invalidando `['customer', 'balances']`, `['customer', 'statement']` e `['customer', 'coupons']`.

---

## 3. Critérios de Aceite

- [ ] Comando `node ace coupons:expire` e serviço `expireOverdueCoupons()` processam cupons vencidos em lotes com `FOR UPDATE`.
- [ ] Idempotência absoluta provada em testes automatizados (execuções repetidas nunca duplicam estorno de pontos).
- [ ] Extrato do consumidor exibe claramente o lançamento `REVERSAL` e o saldo restaurado.
