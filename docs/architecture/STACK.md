# Dependências e arquitetura base do app mobile (Expo)

Guia de referência para montar a base do aplicativo: rotas, autenticação, controle de acesso por roles e demais dependências recomendadas.

> **Regra geral:** use sempre `npx expo install` para libs com código nativo. Ele escolhe a versão compatível com o SDK do Expo em uso.

---

## 1. Setup inicial

```bash
npx create-expo-app@latest meu-app
cd meu-app
```

O template já inclui:

- **Expo Router** (rotas baseadas em arquivos)
- TypeScript
- Reanimated e Gesture Handler

---

## 2. Autenticação

```bash
npx expo install expo-secure-store expo-auth-session expo-web-browser expo-crypto expo-local-authentication
```

| Pacote | Uso |
| --- | --- |
| `expo-secure-store` | Armazenar token com segurança (Keychain/Keystore). **Nunca** usar AsyncStorage para token. |
| `expo-auth-session` + `expo-web-browser` | Login social / OAuth (Google, Apple). |
| `expo-crypto` | Dependência de apoio para fluxos OAuth/PKCE. |
| `expo-local-authentication` | Biometria (opcional). |

### Escolha do provedor

A decisão depende do backend:

- **API própria Adonis:** Sanctum.

---

## 3. Roles e controle de acesso

Não é necessária uma lib específica. O padrão adotado:

1. O backend devolve a role do usuário (no endpoint `/me` ou como claim no JWT).
2. Um `AuthProvider` (Context ou Zustand) guarda `user`, `role` e `status` (carregando, autenticado, anônimo).
3. O Expo Router bloqueia grupos inteiros de rotas com **route groups** e `Stack.Protected`.

### Estrutura de rotas

```
app/
  _layout.tsx          // AuthProvider + guards
  (auth)/
    login.tsx
    registro.tsx
  (app)/
    _layout.tsx
    index.tsx          // telas comuns a todos os usuários
  (admin)/
    _layout.tsx        // somente role admin
  (staff)/
    _layout.tsx        // somente role staff
```

### Guards no layout raiz

```tsx
// app/_layout.tsx (esboço)
<Stack>
  <Stack.Protected guard={!isAuthenticated}>
    <Stack.Screen name="(auth)" />
  </Stack.Protected>

  <Stack.Protected guard={isAuthenticated}>
    <Stack.Screen name="(app)" />
  </Stack.Protected>

  <Stack.Protected guard={role === 'admin'}>
    <Stack.Screen name="(admin)" />
  </Stack.Protected>
</Stack>
```

> ⚠️ **Importante:** esconder telas no app é apenas UX. A autorização real **deve** ser validada no backend em cada endpoint.

---

## 4. Dados e estado

```bash
npm i @tanstack/react-query zustand axios zod react-hook-form @hookform/resolvers
```

| Pacote | Uso |
| --- | --- |
| `@tanstack/react-query` | Cache, retry e refetch das chamadas de API. |
| `zustand` | Estado global leve (sessão, preferências). |
| `axios` | Cliente HTTP, com interceptor para anexar o token e tratar 401/refresh. |
| `zod` | Validação de formulários e de respostas da API. |
| `react-hook-form` + `@hookform/resolvers` | Formulários com validação via Zod. |

---

## 5. Demais dependências recomendadas

| Necessidade | Instalação / Pacote |
| --- | --- |
| Notificações push | `npx expo install expo-notifications expo-device` |
| Imagens e listas performáticas | `npx expo install expo-image @shopify/flash-list` |
| Detecção de conectividade (offline) | `npx expo install @react-native-community/netinfo` |
| Internacionalização | `npx expo install expo-localization` + `npm i i18next react-i18next` |
| Datas | `npm i date-fns` |
| Teclado em formulários | `react-native-keyboard-controller` |
| Monitoramento de erros | `npx expo install @sentry/react-native` |
| Atualizações OTA | `npx expo install expo-updates` (via EAS Update) |
| Deep links | `expo-linking` (já vem com o router); definir `scheme` no `app.json` |

### Estilização (escolher uma)

- **NativeWind** (sintaxe Tailwind)
- **Unistyles**
- **Tamagui**

### Variáveis de ambiente

Use o prefixo `EXPO_PUBLIC_` no `.env`. Lembre que **nada ali é segredo**, pois o valor vai embutido no bundle.

---

## 6. Qualidade e build

```bash
npm i -D eslint prettier jest-expo @testing-library/react-native
npm i -g eas-cli
```

- **EAS Build** para gerar os binários e **EAS Submit** para enviar às lojas.
- **Maestro** para testes E2E em fluxos críticos (ex.: login).
- Libs com código nativo fora do Expo Go (ex.: MMKV) exigem um **development build**:

```bash
npx expo run:android
# ou
eas build --profile development
```

---

## 7. Checklist de implementação

- [ ] Criar o projeto e configurar TypeScript, ESLint e Prettier
- [ ] Definir o provedor de autenticação e o backend
- [ ] Implementar `AuthProvider` com `user`, `role` e `status`
- [ ] Configurar armazenamento do token com `expo-secure-store`
- [ ] Criar o cliente Axios com interceptors (token, 401, refresh)
- [ ] Estruturar route groups por role e aplicar `Stack.Protected`
- [ ] Garantir validação de autorização por role no backend
- [ ] Configurar TanStack Query e tratamento de offline
- [ ] Configurar notificações push
- [ ] Integrar monitoramento de erros (Sentry)
- [ ] Configurar EAS Build, EAS Update e o development build
