# TASK-02: Autenticação, Armazenamento Seguro e Controle de Acesso por Role

- **Responsável:** Engenheiro Mobile (React Native / Expo)
- **Status:** READY
- **Dependências:** TASK-01
- **Relação com Backend:** Tasks #1 e #2 do backend Adonis

---

## 1. Objetivo & Escopo

Implementar os fluxos completos de autenticação no aplicativo mobile: login unificado, cadastro de consumidor global (com aceite de termos) e cadastro de lojista (onboarding do comércio). O token opaco retornado pelo AdonisJS (`oat_...`) deve ser armazenado com segurança criptográfica via `expo-secure-store`. As rotas do aplicativo devem ser protegidas no layout raiz por meio de Route Groups (`(auth)`, `(consumer)` e `(merchant)`), garantindo que apenas usuários autorizados com a role adequada acessem suas respectivas interfaces.

---

## 2. Telas e Rotas Correspondentes

- `src/app/(auth)/_layout.tsx`: Layout da pilha de autenticação sem header nativo.
- `src/app/(auth)/login.tsx`: Tela de login com campos de e-mail e senha, validação de formato e alternância para cadastros.
- `src/app/(auth)/signup-consumer.tsx`: Cadastro de consumidor com campos de Nome Completo, E-mail, Senha, Confirmação, CPF, Telefone e Checkbox de Aceite dos Termos de Uso.
- `src/app/(auth)/signup-merchant.tsx`: Formulário de Onboarding de Estabelecimento com dados do usuário gestor, dados empresariais (CNPJ, Razão Social, Nome Fantasia) e Endereço.
- `src/app/(consumer)/_layout.tsx`: Guard de layout para o grupo de consumidor (`userType === 'CUSTOMER'`).
- `src/app/(merchant)/_layout.tsx`: Guard de layout para o grupo de lojista (`userType === 'ESTABLISHMENT'`), incluindo exibição de banner informativo caso o estabelecimento esteja `status === 'PENDING'`.

---

## 3. Endpoints da API do Backend Consumidos

### 3.1. Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Payload:** `{ email: string, password: string }`
- **Resposta Sucesso (200):**
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "userType": "CUSTOMER",
      "status": "ACTIVE"
    },
    "token": "oat_..."
  }
  ```

### 3.2. Cadastro de Consumidor
- **Endpoint:** `POST /api/v1/auth/customer/signup`
- **Payload:**
  ```json
  {
    "fullName": "Maria Silva",
    "email": "maria@example.com",
    "password": "password123",
    "passwordConfirmation": "password123",
    "cpf": "12345678901",
    "phone": "11999999999",
    "termsAccepted": true,
    "deviceToken": "expo_or_fcm_token_optional"
  }
  ```
- **Resposta Sucesso (201):**
  ```json
  {
    "user": { "id": 1, "email": "maria@example.com", "userType": "CUSTOMER", "status": "ACTIVE" },
    "profile": { "id": 1, "fullName": "Maria Silva", "cpf": "12345678901", "phone": "11999999999" },
    "token": "oat_..."
  }
  ```

### 3.3. Cadastro / Onboarding de Estabelecimento
- **Endpoint:** `POST /api/v1/auth/establishment/register`
- **Payload:**
  ```json
  {
    "user": {
      "fullName": "Mariana Souza",
      "email": "mariana@loja.com",
      "password": "password123",
      "passwordConfirmation": "password123"
    },
    "establishment": {
      "cnpj": "12345678000195",
      "legalName": "Loja Ltda",
      "tradeName": "Minha Loja",
      "conversionFactor": 1.0,
      "contact": { "phone": "4832220000", "whatsapp": "48999990000", "email": "contato@loja.com" }
    },
    "address": {
      "postalCode": "88010000",
      "state": "SC",
      "city": "Florianópolis",
      "neighborhood": "Centro",
      "street": "Rua Felipe Schmidt",
      "number": "100"
    }
  }
  ```
- **Resposta Sucesso (201):**
  ```json
  {
    "message": "Comércio cadastrado com sucesso. Sua conta está pendente de homologação.",
    "user": { "id": 2, "email": "mariana@loja.com", "userType": "ESTABLISHMENT", "status": "ACTIVE" },
    "profile": { "id": 1, "fullName": "Mariana Souza", "role": "LOJISTA_ADMIN" },
    "establishment": { "id": 1, "cnpj": "12345678000195", "tradeName": "Minha Loja", "status": "PENDING" },
    "token": "oat_..."
  }
  ```

### 3.4. Logout
- **Endpoint:** `POST /api/v1/account/logout`
- **Headers:** `Authorization: Bearer oat_...`
- **Resposta Sucesso (200):** `{ "message": "Logged out successfully" }`

---

## 4. Regras de Negócio Aplicáveis

- **RN06 (Onboarding de Lojistas):** O cadastro do estabelecimento é criado com status `PENDING`. O app deve tratar esse status na interface do lojista, alertando que a loja está em fase de homologação cadastral pela equipe administrativa.
- **Armazenamento Seguro:** O token opaco deve ser gravado exclusivamente via `expo-secure-store`. É proibido o uso de `AsyncStorage` comum para guardar o token.
- **Validação de Formulários:** CPF e CNPJ devem passar por validação de dígitos verificadores e máscaras antes da submissão. O checkbox de termos de uso é obrigatório para o cadastro de consumidor.

---

## 5. Critérios de Aceite

- [ ] Formulários validados com React Hook Form e esquemas Zod (formatos de e-mail, senha mínima de 8 caracteres, CPFs/CNPJs válidos).
- [ ] Login autentica com sucesso na API, salva o token no `expo-secure-store` e popula a store `useAuthStore`.
- [ ] Redirecionamento automático baseado em papel:
  - Consumidor (`CUSTOMER`) é direcionado para `/(consumer)/(tabs)`.
  - Lojista (`ESTABLISHMENT`) é direcionado para `/(merchant)/(tabs)`.
- [ ] Bloqueio de rotas não autorizadas: tentativa de acessar rota de lojista por um consumidor redireciona imediatamente para a home do consumidor, e vice-versa.
- [ ] Interceptor do Axios anexa automaticamente o token salvo em todas as requisições autenticadas.
- [ ] Resposta HTTP 401 dispara limpeza da sessão na store, remoção do token no `expo-secure-store` e redirecionamento para `/(auth)/login`.
- [ ] Botão de logout na tela de perfil chama `POST /api/v1/account/logout`, limpa a sessão e retorna à tela de login.
