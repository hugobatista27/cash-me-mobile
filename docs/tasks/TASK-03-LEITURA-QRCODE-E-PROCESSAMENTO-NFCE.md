# TASK-03: Leitura de QR Code, Validação Local e Processamento de NFC-e

- **Responsável:** Engenheiro Mobile (React Native / Expo)
- **Status:** READY
- **Dependências:** TASK-02
- **Relação com Backend:** Tasks #3, #4 e #5 do backend Adonis, ADR-001 e ADR-002

---

## 1. Objetivo & Escopo

Implementar o módulo central de captura de notas fiscais pelo consumidor. O fluxo contempla a leitura da câmera usando `expo-camera`, visualizador com retículo e mira de alinhamento, parsing da URL da SEFAZ, validação instantânea das regras de negócio no dispositivo (estados autorizados SC/PR, chave de acesso de 44 dígitos, emissão recente), envio para a API via `POST /api/v1/customer/invoices/process` e tratamento de respostas síncronas/assíncronas (com exibição imediata de pontos ganhos, estabelecimento pontuado e novo saldo). Além disso, deve prover uma tela de fallback para digitação manual da chave de 44 dígitos caso o QR Code físico esteja danificado.

---

## 2. Telas e Rotas Correspondentes

- `src/app/(consumer)/(tabs)/scan.tsx`: Tela principal de scanner de QR Code com câmera nativa, controle de lanterna (flash) e botão para digitação manual.
- `src/app/(consumer)/scan-manual.tsx`: Modal / tela para entrada manual da chave de acesso de 44 dígitos numéricos com máscara formatada.
- `src/app/(consumer)/invoice/[id].tsx`: Tela de confirmação e detalhes da nota fiscal processada com destaque para os pontos acumulados.

---

## 3. Endpoints da API do Backend Consumidos

### 3.1. Processamento da Nota Fiscal
- **Endpoint:** `POST /api/v1/customer/invoices/process`
- **Headers:** `Authorization: Bearer oat_...`
- **Payload:**
  ```json
  {
    "accessKey": "42230912345678000195650010000001231000001234",
    "qrCodeUrl": "https://sat.sef.sc.gov.br/nfce/qrcode?p=42230912345678000195650010000001231000001234|2|1|1|...",
    "issuerState": "SC",
    "issuerCnpj": "12345678000195",
    "issuedAt": "2026-10-10T14:00:00Z",
    "totalAmount": 150.00
  }
  ```
- **Resposta Sucesso (200 / 202):**
  ```json
  {
    "invoice": {
      "id": 42,
      "accessKey": "42230912345678000195650010000001231000001234",
      "totalAmount": 150.00,
      "status": "PROCESSED"
    },
    "pointsAwarded": 150,
    "status": "PROCESSED",
    "rejectionReason": null,
    "balance": {
      "id": 10,
      "currentBalance": 450,
      "totalAccumulated": 450
    },
    "establishment": {
      "id": 5,
      "tradeName": "Padaria Real",
      "cnpj": "12345678000195"
    }
  }
  ```
- **Respostas de Erro:**
  - `409 Conflict` com `{ "code": "E_DUPLICATE_INVOICE", "message": "Esta nota fiscal já foi processada." }`
  - `422 Unprocessable Entity` com erros de validação da data ou regras.

---

## 4. Regras de Negócio Aplicáveis

- **RN01 (Janela de 48 Horas):** Se a data de emissão estiver presente nos parâmetros da URL ou for analisada no client, notas emitidas há mais de 48h devem ser bloqueadas imediatamente com mensagem de aviso.
- **RN02 (Unicidade da Chave de Acesso):** A chave de 44 dígitos deve ser extraída via regex `([0-9]{44})`. Se a API retornar `E_DUPLICATE_INVOICE`, o app deve exibir mensagem clara explicando que cada NFC-e só gera pontos uma única vez.
- **RN07 (Restrição Geográfica SC e PR):** O validador local `isValidSefazUrl` deve checar o host (`sat.sef.sc.gov.br`, `fazenda.pr.gov.br`) e o código de estado na chave (42 para SC, 41 para PR). Notas de outros estados (ex: SP 35, RJ 33) são rejeitadas localmente sem consumir requisição ao backend.
- **RN03 (Vinculação via CNPJ):** A pontuação é computada no saldo da loja parceira correspondente ao CNPJ emitente retornado pela SEFAZ.

---

## 5. Critérios de Aceite

- [ ] Solicitação graciosa de permissão de câmera via `expo-camera` com explicação amigável ao usuário.
- [ ] Retículo de escaneamento (*viewfinder*) desenhado na tela com animação e feedback de leitura.
- [ ] Módulo utilitário `src/utils/nfceParser.ts` realiza:
  - Extração da chave de acesso de 44 dígitos a partir de URLs e textos.
  - Validação de domínios SEFAZ autorizados (SC e PR - RN07).
  - Validação da janela temporal de 48 horas quando a data de emissão estiver disponível (RN01).
- [ ] QR Codes de estados não suportados exibem alerta informativo imediato e não enviam payload à API.
- [ ] Envio bem-sucedido exibe modal/tela de sucesso vibrante com os pontos adicionados (`+X pts`) e o nome da loja parceira.
- [ ] TanStack Query invalida automaticamente as chaves `['customer', 'balances']`, `['customer', 'statement', establishmentId]` e `['customer', 'invoices']` após o cômputo da nota.
- [ ] Tratamento adequado de erros com feedback tátil de erro:
  - Nota duplicada (`409 / E_DUPLICATE_INVOICE`).
  - Nota expirada há mais de 48h.
  - Falha de conexão.
- [ ] Tela de digitação manual de chave (`scan-manual.tsx`) com input formatado (blocos de 4 dígitos) e botão de envio ativo apenas com 44 dígitos preenchidos.
