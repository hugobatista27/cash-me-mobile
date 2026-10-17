# TASK-12: Validação e Consumo de Cupons no Caixa (Backend, Mobile Lojista & Admin Web)

- **Responsável:** Backend Developer (AdonisJS v6) + Mobile Developer (Expo / React Native)
- **Status:** BACKLOG (Depende de TASK-11.1)
- **Dependências:** TASK-02, TASK-11
- **Relação com Backend:** [`cash-me/docs/tasks/12-validacao-e-consumo-de-cupons-no-caixa.md`](../../../cash-me/docs/tasks/12-validacao-e-consumo-de-cupons-no-caixa.md), **RN10**, **ADR-002**, **ADR-003**

---

## 1. Objetivo & Escopo

Permitir que o operador do caixa (`LOJISTA_ADMIN` ou `LOJISTA_OPERADOR`) consulte e consuma o cupom de desconto apresentado pelo consumidor no momento do pagamento, tanto digitando o código alfanumérico curto quanto lendo o QR Code do cupom pela câmera. A API valida o isolamento por tenant (`establishment_id`), verifica se o cupom está `ACTIVE` e dentro da validade (`expires_at >= now()`), e marca como `USED` de forma atômica com lock pessimista (`SELECT FOR UPDATE`).

---

## 2. Sub-tarefas Operacionais

### 2.1. Backend (AdonisJS v6 - `cash-me/`)
- **TASK-12.1 (Service & Controller de Validação de Caixa):**
  - Adicionar métodos em `CouponRedemptionService` e criar `app/controllers/establishment_coupons_controller.ts`:
    - `POST /api/v1/establishment/coupons/verify` (e alias `/api/v1/establishments/coupons/verify`):
      - Payload: `{ code: string }`
      - Busca cupom pelo `code` (case-insensitive) filtrando obrigatoriamente por `establishment_id = lojista.establishmentId` (ADR-002).
      - Valida `status === 'ACTIVE'` e `expires_at >= DateTime.now()`.
      - Retorna detalhes completos: dados do benefício (`discountType`, `discountValue`, `minPurchaseAmount`, `maxDiscountAmount`), título da recompensa e dados básicos do cliente (`fullName`, `cpf` mascarado).
    - `POST /api/v1/establishment/coupons/consume` (e alias `/api/v1/establishments/coupons/consume`):
      - Payload: `{ code: string, purchaseAmount?: number }`
      - Inicia transação SQL com `SELECT ... FOR UPDATE` no registro `coupon_redemptions`.
      - Revalida que pertence ao `establishment_id` do lojista autenticado, que `status === 'ACTIVE'` e que `expires_at >= DateTime.now()`.
      - Se `purchaseAmount` for informado, valida `purchaseAmount >= coupon.minPurchaseAmount`.
      - Atualiza: `status = 'USED'`, `used_at = DateTime.now()`, `used_by_user_id = auth.user.id`.
- **TASK-12.2 (Testes de Integração e Concorrência no Caixa):**
  - Testes funcionais Japa cobrindo:
    - Cupom válido verificado e consumido (`200 OK`).
    - Duas requisições simultâneas de `/consume` para o mesmo código: apenas 1 sucede (`200`), a outra falha com `409 Conflict` (`E_COUPON_ALREADY_USED`).
    - Cupom expirado (`422 E_COUPON_EXPIRED`).
    - Cupom pertencente a outro lojista (`404 Not Found` — isolamento multi-tenant).

### 2.2. Mobile Lojista & Admin Web (`cash-me-mobile/`)
- **TASK-12.3 (Service & Hooks de Validação no Lojista):**
  - Criar métodos `verifyCoupon(code)` e `consumeCoupon(code, purchaseAmount)` em `src/services/merchantCoupons.ts` e hooks correspondentes.
- **TASK-12.4 (Tela de Caixa / Validador de Cupom no App Lojista):**
  - Criar tela/modal `src/app/(merchant)/validate-coupon.tsx` acessível diretamente a partir do Dashboard do Lojista (`/(merchant)/(tabs)/index.tsx`):
    - Input destacado para digitação rápida do código de 6-8 caracteres.
    - Botão para abrir leitor de QR Code (`QrScannerModal`) e ler o QR Code da tela do cliente.
    - Card de conferência prévia exibindo o benefício (ex: *"Desconto de R$ 15,00 — Compra mínima R$ 50,00"*), nome do cliente e botão de ação primária **"Confirmar Uso do Cupom"**.

---

## 3. Critérios de Aceite

- [ ] `POST /establishment/coupons/verify` e `/consume` respeitam estritamente o `establishment_id` do operador logado (`LOJISTA_ADMIN` ou `LOJISTA_OPERADOR`).
- [ ] Lock pessimista (`FOR UPDATE`) impede uso duplo concorrente do mesmo cupom no caixa.
- [ ] Interface do Lojista permite validar cupom via código digitado ou scanner de QR Code e exibe confirmação visual imediata.
