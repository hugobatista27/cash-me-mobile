# TASK-07: Perfis de Usuário, Biometria, Termos de Uso e Privacidade

- **Responsável:** Engenheiro Mobile (React Native / Expo)
- **Status:** READY
- **Dependências:** TASK-02
- **Relação com Backend:** Tasks #2, #8 do backend Adonis, RN08

---

## 1. Objetivo & Escopo

Desenvolver as telas de gestão de perfil tanto para o Consumidor (`src/app/(consumer)/(tabs)/profile.tsx`) quanto para o Lojista (`src/app/(merchant)/(tabs)/profile.tsx`). O módulo permite edição de dados cadastrais (nome, telefone), ativação de autenticação biométrica via `expo-local-authentication`, visualização dos termos de uso da plataforma, logout seguro com revogação de token na API e, no caso do lojista, a tela de Clientes Fidelizados (`customers.tsx`) com estrita observância à regra de privacidade RN08 (apenas dados de quem já pontuou na loja).

---

## 2. Telas e Rotas Correspondentes

- `src/app/(consumer)/(tabs)/profile.tsx`: Perfil do Consumidor:
  - Avatar com iniciais, Nome, E-mail e CPF mascarado (`***.***.123-**`).
  - Formulário para alteração de Nome Completo e Telefone.
  - Alternador (*Switch*) para ativar/desativar login por biometria (FaceID/TouchID).
  - Link modal para Termos de Uso e Política de Privacidade.
  - Botão de Logout com confirmação.
- `src/app/(merchant)/(tabs)/profile.tsx`: Perfil do Lojista:
  - Dados da Loja: Razão Social, Nome Fantasia, CNPJ mascarado.
  - Endereço físico e canais de atendimento.
  - Dados do usuário gestor e sua role (`LOJISTA_ADMIN` ou `LOJISTA_OPERADOR`).
  - Botão de Logout.
- `src/app/(merchant)/(tabs)/customers.tsx`: Lista de Clientes da Loja:
  - Listagem dos clientes que possuem pontos gerados no estabelecimento.
  - Exibição de Nome, Data da última compra e Total de pontos acumulados na loja.

---

## 3. Endpoints da API do Backend Consumidos

### 3.1. Perfil do Consumidor
- `GET /api/v1/account/customer/profile` -> Obter perfil `{ user, profile: { fullName, cpf, phone } }`
- `PUT /api/v1/account/customer/profile` -> Atualizar `{ fullName, phone }`

### 3.2. Perfil do Lojista
- `GET /api/v1/account/establishment/profile` -> Obter perfil do lojista e dados do comércio `{ user, profile: { fullName, role, establishment: {...} } }`
- `PUT /api/v1/account/establishment/profile` -> Atualizar dados do usuário gestor `{ fullName }`

### 3.3. Logout
- `POST /api/v1/account/logout` -> Revogação de token ativo.

---

## 4. Regras de Negócio Aplicáveis

- **RN08 (Dados do Consumidor vs Privacidade / LGPD):** O lojista **apenas** pode visualizar informações demográficas (nome, e-mail de contato e telefone) de consumidores que tenham efetivamente consumido e pontuado em seu respectivo `estabelecimento_id` ao menos uma vez. O endpoint e a listagem mobile garantem que dados de outros consumidores da plataforma permaneçam completamente inacessíveis.
- **Segurança de Credenciais:** Logout deve sempre chamar o endpoint de revogação no servidor e imediatamente purgar as chaves do `expo-secure-store`.

---

## 5. Critérios de Aceite

- [ ] Tela de perfil do consumidor permite atualizar nome e telefone com validação de formato.
- [ ] Ativação opcional de biometria através de `expo-local-authentication`:
  - Se ativado, ao reabrir o app o usuário pode autenticar via FaceID/TouchID sem digitar senha.
- [ ] Tela de clientes do lojista (`customers.tsx`) consome endpoint com filtro pelo `estabelecimento_id` do usuário logado (RN08).
- [ ] Termos de uso exibidos em modal com rolagem e registro de aceite.
- [ ] Logout limpa estado da store, apaga token do `expo-secure-store` e redireciona para a tela de login.
