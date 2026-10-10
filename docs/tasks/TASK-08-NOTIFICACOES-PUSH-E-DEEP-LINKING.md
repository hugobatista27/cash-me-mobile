# TASK-08: Notificações Push com Expo / FCM e Deep Linking

- **Responsável:** Engenheiro Mobile (React Native / Expo)
- **Status:** READY
- **Dependências:** TASK-02, TASK-03, TASK-04
- **Relação com Backend:** Task #9 do backend Adonis (`notificacoes-push-de-conclusao-fcm.md`) e ADR-001

---

## 1. Objetivo & Escopo

Integrar o aplicativo mobile ao ecossistema de notificações push utilizando `expo-notifications` e Firebase Cloud Messaging (FCM). Em conformidade com a arquitetura orientada a eventos do backend (onde a leitura de NFC-e pode ser processada de forma assíncrona por workers de scraping), o app deve registrar o `deviceToken` do dispositivo no login/cadastro, escutar notificações em primeiro plano (*foreground*) e segundo plano (*background*), atualizar os caches de saldo e abrir a tela correta (nota ou extrato) através de *Deep Linking* quando o usuário toca na notificação.

---

## 2. Telas e Rotas Correspondentes

- `src/app/_layout.tsx`: Configuração global de manipuladores de notificação (*Notification Handlers*) e listeners de resposta (*response listeners*).
- `src/app/(consumer)/invoice/[id].tsx`: Destino de redirecionamento quando a notificação push informa sucesso no processamento da nota.
- `src/app/(consumer)/statement/[id].tsx`: Destino alternativo para visualização do extrato da loja pontuada.

---

## 3. Endpoints da API do Backend Consumidos

### 3.1. Envio do Device Token no Cadastro / Perfil
- **Endpoint:** `POST /api/v1/auth/customer/signup` ou `PUT /api/v1/account/customer/profile`
- **Payload:** `{ deviceToken: "ExponentPushToken[...]" }` ou token FCM nativo.

### 3.2. Formato da Notificação Recebida (Origem Backend - Task #9)
```json
{
  "to": "device_token_do_consumidor",
  "notification": {
    "title": "Pontos creditados com sucesso! 🎉",
    "body": "Você ganhou 150 pontos na Padaria Real."
  },
  "data": {
    "type": "POINTS_AWARDED",
    "invoiceId": "42",
    "establishmentId": "5",
    "pointsAwarded": 150,
    "url": "cashme://consumer/invoice/42"
  }
}
```

---

## 4. Regras de Negócio Aplicáveis

- **ADR-001 (Scraping Assíncrono Event-Driven):** O mobile submete o QR Code e pode receber `202 Accepted`. A conclusão da UX é assíncrona: o evento `PointsAwardedEvent` do backend dispara o push FCM que acorda o app ou notifica o usuário na central do sistema operacional.
- **Invalidação de Cache no Recebimento:** Ao receber o push em primeiro plano, o app deve invalidar automaticamente as queries `['customer', 'balances']` e `['customer', 'statement']` no TanStack Query para atualizar os saldos sem requerer ação manual do usuário.

---

## 5. Critérios de Aceite

- [ ] Solicitação de permissão nativa de notificações no primeiro acesso do consumidor.
- [ ] Geração do token de push via `Notifications.getExpoPushTokenAsync()` ou `Notifications.getDevicePushTokenAsync()`.
- [ ] Envio do token para o backend no payload de cadastro (`/auth/customer/signup`) ou atualização de perfil (`/account/customer/profile`).
- [ ] Manipulador de notificações em foreground configurado para exibir banner/alerta visual dentro do app.
- [ ] Toque na notificação realiza deep linking imediato para a tela de detalhes da nota correspondente (`/invoice/[id]`).
- [ ] Revalidação em segundo plano dos saldos do consumidor via TanStack Query assim que a notificação é recebida.
