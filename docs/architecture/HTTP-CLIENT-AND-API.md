# Cliente HTTP e Contratos de Integração com a API
## Arquitetura de Comunicação REST (AdonisJS 6 <-> Expo Mobile)

---

## 1. Visão Geral do Cliente HTTP

A comunicação de rede do **Cash Me Mobile** é padronizada através de uma instância configurada do **Axios** em `src/services/api/client.ts`. A instância gerencia:
- Base URL adaptável para ambientes de desenvolvimento (Emulador Android `10.0.2.2`, Dispositivo Físico via IP LAN ou Produção via HTTPS).
- Timeout de requisições configurado para evitar bloqueios em conexões instáveis.
- Interceptor de Requisição: Injeção automática do Bearer Token nos endpoints autenticados.
- Interceptor de Resposta: Detecção de respostas 401 Unauthorized para logout automático e normalização de mensagens de erro emitidas pelo VineJS/AdonisJS.

---

## 2. Configuração do Axios (`src/services/api/client.ts`)

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { secureStorage } from '@/services/storage/secureStorage'
import { useAuthStore } from '@/stores/useAuthStore'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Resolução inteligente de IP em desenvolvimento
function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL
  }

  // Fallback para ambiente local
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3333/api/v1'
    }
    const debuggerHost = Constants.expoConfig?.hostUri
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0]
      return `http://${ip}:3333/api/v1`
    }
    return 'http://localhost:3333/api/v1'
  }

  return 'https://api.cashme.app/api/v1'
}

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// 1. Interceptor de Requisição: Injeção do Bearer Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Tenta primeiro recuperar da store em memória (ultra-rápido)
    let token = useAuthStore.getState().token

    // Fallback para SecureStore
    if (!token) {
      token = await secureStorage.getToken()
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// 2. Interceptor de Resposta: Tratamento de Erros e 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      // Sessão expirada ou revogada: executa logout limpo
      await useAuthStore.getState().logout()
    }

    // Normaliza erro em formato padronizado
    const normalizedError = {
      status: error.response?.status || 500,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message:
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        'Não foi possível conectar ao servidor. Verifique sua conexão.',
      errors: error.response?.data?.errors || [],
    }

    return Promise.reject(normalizedError)
  }
)
```

---

## 3. Catálogo de Endpoints Consumidos pelo App Mobile

A tabela abaixo lista os contratos de integração com a API Adonis (`cash-me/start/routes.ts`):

### 3.1. Autenticação e Perfis (`/api/v1/auth` e `/api/v1/account`)

| Método | Endpoint | Papel Requerido | Descrição / Payload | Resposta Principal |
|---|---|---|---|---|
| `POST` | `/auth/login` | Público | Autenticação por e-mail e senha `{ email, password }` | `{ user, token }` |
| `POST` | `/auth/customer/signup` | Público | Cadastro de consumidor `{ fullName, email, password, passwordConfirmation, cpf, phone, termsAccepted, deviceToken }` | `{ user, profile, token }` |
| `POST` | `/auth/establishment/register` | Público | Onboarding completo de lojista `{ user, establishment, address }` | `{ message, user, profile, establishment, token }` |
| `POST` | `/account/logout` | Autenticado | Revogação de token ativo | `{ message: "Logged out successfully" }` |
| `GET` | `/account/customer/profile` | `CUSTOMER` | Dados do perfil do consumidor autenticado | `{ user, profile }` |
| `PUT` | `/account/customer/profile` | `CUSTOMER` | Atualização de dados cadastrais `{ fullName, phone }` | `{ profile }` |
| `GET` | `/account/establishment/profile` | `ESTABLISHMENT` | Dados do perfil e dados da loja vinculada | `{ user, profile: { establishment } }` |
| `PUT` | `/account/establishment/profile` | `ESTABLISHMENT` | Atualização do perfil do lojista | `{ profile }` |

### 3.2. Operações do Consumidor (`/api/v1/customer`)

| Método | Endpoint | Papel Requerido | Descrição / Payload | Resposta Principal |
|---|---|---|---|---|
| `POST` | `/customer/invoices/process` | `CUSTOMER` | Processamento de NFC-e `{ accessKey, qrCodeUrl, issuerState, issuerCnpj, issuedAt, totalAmount }` | `{ invoice, pointsAwarded, status, balance, establishment }` |
| `GET` | `/customer/invoices` | `CUSTOMER` | Histórico de notas fiscais lidas pelo usuário | `Array<Invoice>` |
| `GET` | `/customer/invoices/:id` | `CUSTOMER` | Detalhes da nota específica e itens comprados | `{ id, accessKey, totalAmount, pointsAwarded, items: [...] }` |
| `GET` | `/customer/balances` | `CUSTOMER` | Saldos acumulados agrupados por estabelecimento | `Array<{ currentBalance, totalAccumulated, establishment }>` |
| `GET` | `/customer/establishments/:id/statement` | `CUSTOMER` | Extrato de transações do consumidor em loja específica | `Array<{ id, type, points, description, createdAt }>` |

### 3.3. Estabelecimentos e Lojas Credenciadas (`/api/v1/establishments`)

| Método | Endpoint | Papel Requerido | Descrição / Payload | Resposta Principal |
|---|---|---|---|---|
| `GET` | `/establishments` | Autenticado | Lista de todos os comércios parceiros cadastrados | `Array<Establishment>` |
| `GET` | `/establishments/:id` | Autenticado | Detalhes de um comércio e seu endereço físico | `{ id, cnpj, tradeName, address: {...} }` |

### 3.4. Regras de Fidelidade do Lojista (`/api/v1/establishment`)

| Método | Endpoint | Papel Requerido | Descrição / Payload | Resposta Principal |
|---|---|---|---|---|
| `GET` | `/establishment/loyalty-rule` | `LOJISTA_*` | Consulta a regra de pontos ativa da loja autenticada | `{ id, version, baseAmount, pointsPerBase, humanReadableSummary }` |
| `GET` | `/establishment/loyalty-rule/simulate` | `LOJISTA_*` | Simulação em tempo real `{ amount, baseAmount?, pointsPerBase? }` | `{ purchaseAmount, calculatedPoints, humanReadableSummary }` |
| `PUT` | `/establishment/loyalty-rule` | `LOJISTA_ADMIN` | Publicação de nova versão da regra `{ baseAmount, pointsPerBase, minPurchaseAmount?, maxPointsPerPurchase?, name? }` | `{ id, version, baseAmount, pointsPerBase, status: 'ACTIVE' }` |
| `GET` | `/establishment/loyalty-rule/history` | `LOJISTA_*` | Histórico auditável de versões anteriores da regra | `Array<PointRule>` |

---

## 4. Tratamento Padronizado de Erros de Negócio

O app mapeia códigos de exceção HTTP para respostas visuais claras:

```typescript
export function getFriendlyErrorMessage(error: any): string {
  switch (error.code) {
    case 'E_DUPLICATE_INVOICE':
      return 'Esta nota fiscal já foi processada anteriormente. Cada NFC-e só pode pontuar uma única vez (RN02).'
    case 'E_INVOICE_EXPIRED':
      return 'Esta nota fiscal foi emitida há mais de 48 horas e não é elegível para pontos (RN01).'
    case 'E_INVALID_STATE':
      return 'No momento, aceitamos apenas notas fiscais emitidas em Santa Catarina e Paraná (RN07).'
    case 'E_INVALID_CREDENTIALS':
      return 'E-mail ou senha incorretos. Verifique suas credenciais.'
    default:
      return error.message || 'Ocorreu um erro inesperado. Tente novamente em instantes.'
  }
}
```
