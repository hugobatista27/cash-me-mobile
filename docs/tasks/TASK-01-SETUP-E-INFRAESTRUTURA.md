# TASK-01: Setup do Projeto, Design Tokens e Infraestrutura Base

- **Responsável:** Engenheiro Mobile (React Native / Expo)
- **Status:** READY
- **Dependências:** Nenhuma

---

## 1. Objetivo & Escopo

Configurar a infraestrutura inicial do projeto `cash-me-mobile` utilizando o Expo SDK com TypeScript em modo estrito. Esta tarefa estabelece a base para todos os módulos subsequentes, configurando o cliente HTTP Axios com interceptors, o provedor TanStack Query para cache de rede, as stores Zustand para estado global em memória, as bibliotecas de interface essenciais (`react-native-safe-area-context`, `react-native-reanimated`) e a centralização dos tokens de design extraídos de `cash-me-front`.

---

## 2. Telas e Rotas Correspondentes

- `src/app/_layout.tsx`: Layout raiz da aplicação configurado com `QueryClientProvider` e `SafeAreaProvider`.
- `src/app/index.tsx`: Tela de entrada transitória (Splash com carregador animado).
- `src/app/+not-found.tsx`: Tela de recurso não encontrado com botão de redirecionamento para o início.

---

## 3. Endpoints da API do Backend Consumidos

- Nenhum endpoint de negócio é consumido diretamente nesta tarefa.
- A baseURL do Axios deve apontar para `http://10.0.2.2:3333/api/v1` (Android Emulator), `http://localhost:3333/api/v1` (iOS Simulator) ou `EXPO_PUBLIC_API_URL`.
- Implementação do endpoint de health check `GET /` ou `GET /swagger` para validação de conectividade em modo desenvolvimento.

---

## 4. Regras de Negócio Aplicáveis

- **Infraestrutura Geral:** Garantir que variáveis de ambiente públicas usem o prefixo `EXPO_PUBLIC_` conforme as diretrizes do Expo.
- **Resiliência:** O cliente Axios deve configurar timeout de 15 segundos para evitar requisições indefinidamente suspensas em redes móveis instáveis.

---

## 5. Critérios de Aceite

- [ ] Projeto compila e executa sem erros em emuladores Android e iOS via `npx expo start`.
- [ ] TypeScript configurado com `strict: true` em `tsconfig.json` sem alertas de compilação.
- [ ] Arquivo `src/constants/theme.ts` criado e exportando as cores oficiais: Consumidor (`#008D4C`), Lojista (`#6F35B5`), Pontos (`#F5B800`), e Neutros (`#F7F8FA`, `#171717`).
- [ ] Instância de `apiClient` configurada com Axios, timeout de 15s e suporte dinâmico a `EXPO_PUBLIC_API_URL`.
- [ ] `QueryClientProvider` envelopando a raiz da aplicação com configurações padrão (`staleTime: 2min`, `gcTime: 30min`).
- [ ] Store `useAppStore` implementada com Zustand controlando estado de carregamento global e conectividade de rede.
- [ ] Suporte a Safe Area configurado para evitar sobreposição em entalhes de tela (*notches*) e barras de navegação nativas.
