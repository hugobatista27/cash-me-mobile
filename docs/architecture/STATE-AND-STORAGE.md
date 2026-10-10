# Gerenciamento de Estado, Cache e Armazenamento Seguro
## Arquitetura de Estado do Cash Me Mobile

---

## 1. Visão Geral e Princípios

A arquitetura de dados do **Cash Me Mobile** divide o estado da aplicação em três camadas complementares e bem delimitadas:

1. **Estado Seguro e Persistente (Hardware Keystore/Keychain):** Credenciais e tokens de autenticação via `expo-secure-store`.
2. **Estado Global do Cliente (Memória / Reatividade Leve):** Sessão ativa, flags de conectividade e preferências via **Zustand**.
3. **Estado Assíncrono do Servidor (Cache, Deduplicação e Revalidação):** Dados remotos de APIs (saldos, notas fiscais, lojas, regras) via **TanStack Query**.

---

## 2. Armazenamento Seguro (`expo-secure-store`)

Tokens de autenticação emitidos pelo AdonisJS (`oat_...`) contêm privilégios de acesso aos dados fiscais e pontuação do usuário. Em conformidade com as melhores práticas de segurança mobile:

- **Proibição Expressa:** Nunca utilizar `AsyncStorage` desprotegido para guardar tokens de sessão ou dados biométricos.
- **Implementação:** O módulo `src/services/storage/secureStorage.ts` encapsula a API nativa do `expo-secure-store`:

```typescript
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = '@cashme:auth_token'
const REFRESH_KEY = '@cashme:refresh_token'

export const secureStorage = {
  async saveToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  },

  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(REFRESH_KEY)
  },
}
```

---

## 3. Estado Global com Zustand (`src/stores/useAuthStore.ts`)

A store Zustand mantém o estado da sessão em memória para acesso imediato e sem concorrência pelos componentes visuais e pelos interceptors HTTP do Axios:

```typescript
import { create } from 'zustand'
import { secureStorage } from '@/services/storage/secureStorage'
import type { User, CustomerProfile, EstablishmentProfile, Establishment } from '@/types/auth'

interface AuthState {
  token: string | null
  user: User | null
  customerProfile: CustomerProfile | null
  establishmentProfile: EstablishmentProfile | null
  establishment: Establishment | null
  isAuthenticated: boolean
  isRestoringSession: boolean

  // Ações
  setAuthSession: (params: {
    token: string
    user: User
    customerProfile?: CustomerProfile | null
    establishmentProfile?: EstablishmentProfile | null
    establishment?: Establishment | null
  }) => Promise<void>
  updateCustomerProfile: (profile: Partial<CustomerProfile>) => void
  updateEstablishmentProfile: (profile: Partial<EstablishmentProfile>) => void
  restoreSession: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  customerProfile: null,
  establishmentProfile: null,
  establishment: null,
  isAuthenticated: false,
  isRestoringSession: true,

  async setAuthSession({ token, user, customerProfile, establishmentProfile, establishment }) {
    await secureStorage.saveToken(token)
    set({
      token,
      user,
      customerProfile: customerProfile || null,
      establishmentProfile: establishmentProfile || null,
      establishment: establishment || null,
      isAuthenticated: true,
      isRestoringSession: false,
    })
  },

  updateCustomerProfile(updated) {
    const current = get().customerProfile
    if (current) {
      set({ customerProfile: { ...current, ...updated } })
    }
  },

  updateEstablishmentProfile(updated) {
    const current = get().establishmentProfile
    if (current) {
      set({ establishmentProfile: { ...current, ...updated } })
    }
  },

  async restoreSession() {
    try {
      const storedToken = await secureStorage.getToken()
      if (!storedToken) {
        set({ isAuthenticated: false, isRestoringSession: false })
        return
      }

      // Opcional: carregar perfil atualizado do backend via /account/profile
      set({
        token: storedToken,
        isAuthenticated: true,
        isRestoringSession: false,
      })
    } catch {
      await secureStorage.removeToken()
      set({ token: null, user: null, isAuthenticated: false, isRestoringSession: false })
    }
  },

  async logout() {
    await secureStorage.clearAll()
    set({
      token: null,
      user: null,
      customerProfile: null,
      establishmentProfile: null,
      establishment: null,
      isAuthenticated: false,
      isRestoringSession: false,
    })
  },
}))
```

---

## 4. Cache de Dados do Servidor com TanStack Query

Toda a interação com endpoints REST da API Adonis é gerenciada pelo TanStack Query, garantindo eliminação de requisições repetidas, revalidação inteligente em segundo plano e suporte a refetch em foco de tela.

### 4.1. Configuração do `queryClient` (`src/services/api/queryClient.ts`)

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos até os dados serem considerados desatualizados
      gcTime: 1000 * 60 * 30,    // 30 minutos em memória cache para navegação offline rápida
      retry: (failureCount, error: any) => {
        // Não tentar novamente em caso de 401, 403, 404 ou duplicidade de nota (409)
        if (error?.response?.status && [401, 403, 404, 409].includes(error.response.status)) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
    },
  },
})
```

### 4.2. Matriz de Query Keys e Invalidação

A hierarquia de chaves (*Query Keys*) é estritamente estruturada para permitir invalidações parciais ou globais:

| Chave de Cache | Endpoint Backend | Descrição / Uso | Estratégia de Invalidação |
|---|---|---|---|
| `['customer', 'balances']` | `GET /api/v1/customer/balances` | Lista de saldos por estabelecimento | Invalidar após `POST /customer/invoices/process` ou push FCM |
| `['customer', 'statement', establishmentId]` | `GET /api/v1/customer/establishments/:id/statement` | Extrato detalhado da loja | Invalidar quando uma nota daquela loja for processada |
| `['customer', 'invoices']` | `GET /api/v1/customer/invoices` | Histórico de notas fiscais | Invalidar após submissão de nova NFC-e |
| `['customer', 'invoice', id]` | `GET /api/v1/customer/invoices/:id` | Detalhes e itens de uma NFC-e | Cache de longa duração (imutável) |
| `['establishments']` | `GET /api/v1/establishments` | Lojas credenciadas | Revalidação a cada 10 minutos |
| `['establishment', id]` | `GET /api/v1/establishments/:id` | Detalhes da loja | Cache de 10 minutos |
| `['merchant', 'loyalty-rule']` | `GET /api/v1/establishment/loyalty-rule` | Regra ativa do lojista | Invalidar após `PUT /establishment/loyalty-rule` |
| `['merchant', 'loyalty-rule', 'history']` | `GET /api/v1/establishment/loyalty-rule/history` | Histórico de versões | Invalidar após nova versão ser publicada |
| `['merchant', 'customers']` | `GET /api/v1/merchant/customers` (ou mock) | Clientes pontuados | Invalidar periodicamente |

---

## 5. Suporte a Conectividade Offline

O app monitora a conexão de rede através do `@react-native-community/netinfo`. Quando offline:
- As telas continuam exibindo os últimos saldos e extratos gravados no cache do TanStack Query (`gcTime: 30m`).
- O leitor de QR Code permite a leitura local da NFC-e e armazena em fila local ou exibe um aviso "Dispositivo offline: sua nota será enviada assim que a conexão for restabelecida".
