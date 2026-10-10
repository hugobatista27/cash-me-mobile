# Especificação de Roteamento e Proteção por Roles
## Expo Router v4 & Estrutura de Rotas do Cash Me Mobile

---

## 1. Visão Geral

O aplicativo utiliza o **Expo Router v4**, aproveitando a convenção *File-Based Routing* com **Route Groups** (diretórios entre parênteses) para organizar a navegação sem poluir as URLs públicas, e isolar contextos de acesso por papéis de usuário (*Roles*).

Existem três domínios principais de navegação:
1. `(auth)`: Fluxos não autenticados (Login, Cadastros).
2. `(consumer)`: Fluxos do consumidor autenticado (`CUSTOMER`).
3. `(merchant)`: Fluxos do lojista autenticado (`ESTABLISHMENT` / `LOJISTA_ADMIN` / `LOJISTA_OPERADOR`).

---

## 2. Árvore de Diretórios de Rotas

```
src/app/
├── _layout.tsx                     # Root Layout: AuthProvider, QueryClientProvider, Guards globais
├── index.tsx                       # Entrypoint / Splash: Redirecionamento condicional imediato
├── +not-found.tsx                  # 404 Not Found fallback
│
├── (auth)/                         # Grupo Público: Telas de Autenticação
│   ├── _layout.tsx                 # Stack sem header, fundo suave
│   ├── login.tsx                   # Login unificado por email e senha
│   ├── signup-consumer.tsx         # Cadastro de Consumidor Global (Nome, CPF, Tel, Termos)
│   └── signup-merchant.tsx         # Onboarding de Comércio (CNPJ, Endereço, Usuário)
│
├── (consumer)/                     # Grupo Protegido: Consumidor Final
│   ├── _layout.tsx                 # Guard: Permite apenas userType === 'CUSTOMER'
│   ├── (tabs)/                     # Navegação principal em Bottom Tabs
│   │   ├── _layout.tsx             # Tabs estilizadas (tema verde esmeralda)
│   │   ├── index.tsx               # Home: Saldos rápidos por loja, atalhos e destaques
│   │   ├── wallet.tsx              # Carteira: Lista consolidada de saldos e extratos
│   │   ├── scan.tsx                # Scanner de QR Code de NFC-e via câmera
│   │   ├── stores.tsx              # Catálogo de Lojas e Estabelecimentos Credenciados
│   │   └── profile.tsx             # Perfil do Consumidor, Biometria, Termos e Logout
│   ├── scan-manual.tsx             # Modal / Tela para digitação manual da chave de 44 dígitos
│   ├── store/
│   │   └── [id].tsx                # Detalhes da Loja, Regra ativa de fidelidade e Endereço
│   ├── statement/
│   │   └── [id].tsx                # Extrato isolado de pontos para o par Consumidor + Loja
│   └── invoice/
│       └── [id].tsx                # Detalhes da NFC-e processada, itens e pontos ganhos
│
└── (merchant)/                     # Grupo Protegido: Lojista / Estabelecimento
    ├── _layout.tsx                 # Guard: Permite apenas userType === 'ESTABLISHMENT'
    ├── (tabs)/                     # Navegação principal em Bottom Tabs do Lojista
    │   ├── _layout.tsx             # Tabs estilizadas (tema roxo real)
    │   ├── index.tsx               # Dashboard: Regra ativa, clientes e ações rápidas
    │   ├── rules.tsx               # Gestão e Simulação de Regras de Fidelidade
    │   ├── customers.tsx           # Lista de Clientes que pontuaram na loja (RN08)
    │   └── profile.tsx             # Dados da Loja, Endereço, Contato e Logout
    └── rules/
        └── history.tsx             # Histórico versionado de regras anteriores da loja
```

---

## 3. Lógica do Root Guard (`src/app/_layout.tsx`)

O `RootLayout` monitora continuamente o estado de autenticação através do Zustand (`useAuthStore`) e gerencia os redirecionamentos através do `useRouter` e `useSegments` do Expo Router:

```tsx
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/services/api/queryClient'
import { useAuthStore } from '@/stores/useAuthStore'
import { ActivityIndicator, View } from 'react-native'

export default function RootLayout() {
  const { isAuthenticated, user, isRestoringSession } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isRestoringSession) return

    const inAuthGroup = segments[0] === '(auth)'
    const inConsumerGroup = segments[0] === '(consumer)'
    const inMerchantGroup = segments[0] === '(merchant)'

    if (!isAuthenticated) {
      // Usuário não autenticado tentando acessar telas protegidas
      if (!inAuthGroup) {
        router.replace('/(auth)/login')
      }
    } else {
      // Usuário autenticado
      if (inAuthGroup) {
        // Se estiver em telas de auth, redireciona para sua área de destino
        if (user?.userType === 'ESTABLISHMENT') {
          router.replace('/(merchant)/(tabs)')
        } else {
          router.replace('/(consumer)/(tabs)')
        }
      } else if (user?.userType === 'CUSTOMER' && inMerchantGroup) {
        // Consumidor tentando acessar área de lojista
        router.replace('/(consumer)/(tabs)')
      } else if (user?.userType === 'ESTABLISHMENT' && inConsumerGroup) {
        // Lojista tentando acessar área de consumidor
        router.replace('/(merchant)/(tabs)')
      }
    }
  }, [isAuthenticated, user?.userType, isRestoringSession, segments])

  if (isRestoringSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FA' }}>
        <ActivityIndicator size="large" color="#008D4C" />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(consumer)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(merchant)" options={{ animation: 'fade' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Não encontrado' }} />
      </Stack>
    </QueryClientProvider>
  )
}
```

---

## 4. Layouts Específicos de Route Groups

### 4.1. Layout do Consumidor (`src/app/(consumer)/(tabs)/_layout.tsx`)
Configuração das abas com a identidade visual verde do consumidor (`#008D4C`):

- **Início (`index`):** Ícone `home-outline` / `home`
- **Carteira (`wallet`):** Ícone `wallet-outline` / `wallet`
- **Escanear (`scan`):** Botão central destacado com ícone `qr-code` e elevação
- **Lojas (`stores`):** Ícone `storefront-outline` / `storefront`
- **Perfil (`profile`):** Ícone `person-outline` / `person`

### 4.2. Layout do Lojista (`src/app/(merchant)/(tabs)/_layout.tsx`)
Configuração das abas com a identidade visual roxa do lojista (`#6F35B5`):

- **Dashboard (`index`):** Ícone `speedometer-outline` / `speedometer`
- **Regras de Pontos (`rules`):** Ícone `calculator-outline` / `calculator`
- **Clientes (`customers`):** Ícone `people-outline` / `people`
- **Perfil da Loja (`profile`):** Ícone `business-outline` / `business`

### 4.3. Tratamento de Lojista Pendente de Homologação (RN06)
No layout `src/app/(merchant)/_layout.tsx`, é realizada a verificação do status do estabelecimento:

```tsx
const { establishment } = useAuthStore()

if (establishment?.status === 'PENDING') {
  return (
    <View style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      <PendingApprovalBanner cnpj={establishment.cnpj} tradeName={establishment.tradeName} />
      <Slot />
    </View>
  )
}
```

---

## 5. Configuração de Deep Linking

O esquema de URL padrão registrado no `app.json` é `cashme://`:

```json
{
  "expo": {
    "scheme": "cashme",
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://cashme.app"
        }
      ]
    ]
  }
}
```

### Rotas com Suporte a Deep Link e Notificações Push:
- `cashme://consumer/invoice/:id`: Abre diretamente os detalhes da nota fiscal recém-processada após push de confirmação.
- `cashme://consumer/statement/:id`: Abre o extrato específico do estabelecimento vinculado.
- `cashme://consumer/store/:id`: Abre a página da loja credenciada.
