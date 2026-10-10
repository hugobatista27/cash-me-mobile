# TASK-05: Exploração de Estabelecimentos Credenciados e Vitrine de Ofertas

- **Responsável:** Engenheiro Mobile (React Native / Expo)
- **Status:** READY
- **Dependências:** TASK-01, TASK-02
- **Relação com Backend:** Task #1 do backend Adonis

---

## 1. Objetivo & Escopo

Permitir que o consumidor explore a rede credenciada de estabelecimentos parceiros do Cash Me. A tela de exploração de lojas disponibiliza busca por texto (nome da loja, segmento ou cidade), visualização em lista com endereço e badges com a regra ativa de conversão de pontos (ex: "R$ 1,00 = 1 pt"). Ao clicar em um estabelecimento, o usuário visualiza a tela de detalhes com informações de endereço completo, canais de contato (WhatsApp, telefone, Instagram), regra de fidelidade vigente e botão direto para escanear uma nota daquela loja.

---

## 2. Telas e Rotas Correspondentes

- `src/app/(consumer)/(tabs)/stores.tsx`: Tela de exploração de lojas parceiras com campo de busca, filtros de categoria e listagem em cartões.
- `src/app/(consumer)/store/[id].tsx`: Tela de detalhes do estabelecimento selecionado:
  - Banner / Logo do estabelecimento.
  - Nome Fantasia, Razão Social e CNPJ.
  - Regra de conversão ativa traduzida para linguagem humana (RN04).
  - Endereço completo com atalho para abrir no aplicativo de mapas (Google Maps / Apple Maps).
  - Botões de contato direto (WhatsApp e Telefone via Linking nativo).

---

## 3. Endpoints da API do Backend Consumidos

### 3.1. Listagem de Estabelecimentos
- **Endpoint:** `GET /api/v1/establishments`
- **Headers:** `Authorization: Bearer oat_...`
- **Resposta Sucesso (200):**
  ```json
  [
    {
      "id": 1,
      "cnpj": "12345678000195",
      "legalName": "Padaria Real Ltda",
      "tradeName": "Padaria Real",
      "status": "ACTIVE",
      "conversionFactor": 1.0,
      "address": {
        "id": 1,
        "postalCode": "88010000",
        "state": "SC",
        "city": "Florianópolis",
        "neighborhood": "Centro",
        "street": "Rua Felipe Schmidt",
        "number": "100"
      }
    }
  ]
  ```

### 3.2. Detalhes de um Estabelecimento Específico
- **Endpoint:** `GET /api/v1/establishments/:id`
- **Headers:** `Authorization: Bearer oat_...`
- **Resposta Sucesso (200):**
  ```json
  {
    "id": 1,
    "cnpj": "12345678000195",
    "legalName": "Padaria Real Ltda",
    "tradeName": "Padaria Real",
    "status": "ACTIVE",
    "conversionFactor": 1.0,
    "address": {
      "id": 1,
      "postalCode": "88010000",
      "state": "SC",
      "city": "Florianópolis",
      "neighborhood": "Centro",
      "street": "Rua Felipe Schmidt",
      "number": "100"
    }
  }
  ```

---

## 4. Regras de Negócio Aplicáveis

- **RN06 (Visibilidade no Ecossistema):** Apenas estabelecimentos com status aprovado (`status === 'ACTIVE'`) devem ser exibidos na vitrine para os consumidores finais. Estabelecimentos com status `PENDING` são filtrados pelo backend ou ocultados no catálogo.
- **RN04 (Comunicação da Regra de Cômputo):** O fator de conversão deve ser traduzido em frase legível para o usuário (ex: "A cada R$ 10,00 você ganha 1 ponto" quando `conversionFactor = 0.1` ou "R$ 1,00 = 1 ponto" quando `conversionFactor = 1.0`).

---

## 5. Critérios de Aceite

- [ ] Campo de busca em tempo real com debounce de 300ms filtrando por nome da loja ou cidade.
- [ ] Cartões de loja exibem nome, categoria, bairro/cidade e badge com a taxa de pontuação.
- [ ] Tela de detalhes da loja (`/store/[id]`) carrega informações de contato e endereço.
- [ ] Toque no endereço abre o aplicativo nativo de mapas via `Linking.openURL(geo:...)` ou `https://maps.google.com/?q=...`.
- [ ] Toque no telefone ou WhatsApp abre o discador ou o app do WhatsApp via `Linking`.
- [ ] Botão "Escanear Nota Desta Loja" redireciona diretamente para a aba de scanner (`/scan`).
- [ ] Cache TanStack Query configurado com revalidação inteligente a cada 10 minutos.
