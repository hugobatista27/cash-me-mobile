# Diretrizes de UI, Design System e Tokens Visuais
## Identidade Visual e Interface do Cash Me Mobile

---

## 1. Visão Geral

As diretrizes de design do **Cash Me Mobile** seguem fielmente a identidade visual estabelecida no protótipo de referência do front-end (`cash-me-front/CashMe/`). O design é projetado para oferecer:
- **Separação Temática por Role:** O fluxo do Consumidor é dominado por tons de verde esmeralda (confiança, ganho, cashback), enquanto a interface do Lojista adota tons de roxo real (gestão empresarial, sofisticação).
- **Destque de Moeda de Pontos:** A cor dourada âmbar é reservada exclusivamente para expressar pontuações, medalhas e créditos acumulados.
- **Componentes Nativos Acessíveis:** Tipografia legível, suporte a Safe Area (notches, bordas arredondadas e barras de navegação do sistema), alto contraste e feedback tátil (haptics) em ações críticas.

---

## 2. Paleta de Cores e Tokens (`src/constants/theme.ts`)

A paleta de cores é diretamente derivada de `cash-me-front/CashMe/src/constants/theme.ts`:

```typescript
// src/constants/theme.ts

export const Colors = {
  // Consumidor (Verde Esmeralda)
  consumer: {
    primary: '#008D4C',      // G: Verde Primário (Botões principais, Header, Tabs ativas)
    dark: '#006B3A',         // GD: Verde Escuro (Estados pressionados, Headers escuros)
    light: '#E7F5ED',        // GL: Verde Claro (Pílulas de status, badges, fundos suaves)
    veryLight: '#F4FAF6',    // GVL: Verde Muito Claro (Fundos de cards de destaque)
  },

  // Lojista / Comerciante (Roxo Real)
  merchant: {
    primary: '#6F35B5',      // P: Roxo Primário (Header e elementos de ação do lojista)
    dark: '#50218B',         // PD: Roxo Escuro
    light: '#EEE7F7',        // PL: Roxo Claro (Badges e áreas de destaque do lojista)
  },

  // Destaques e Moeda de Pontos
  points: {
    gold: '#F5B800',         // GOLD: Ouro dos Pontos (Ícones de moedas, saldo, estrelas)
    goldLight: '#FEF8E6',    // Fundo dourado suave para badges de pontuação
  },

  // Feedback e Status
  status: {
    error: '#D64545',        // ERR: Vermelho de Erro / Alerta / Nota Rejeitada
    errorLight: '#FDECEC',   // Fundo de aviso de erro
    warning: '#F59E0B',      // Amarelo de Alerta / Pendente de homologação
    success: '#008D4C',      // Verde de Sucesso
    info: '#2563EB',         // Azul de Informação
  },

  // Neutros e Superfícies
  neutral: {
    textPrimary: '#171717',  // T1: Texto Principal Escuro
    textSecondary: '#666666',// T2: Texto Secundário Cinza
    textMuted: '#9CA3AF',    // Texto Esmaecido / Placeholders
    background: '#F7F8FA',   // BG: Fundo da Aplicação (Cinza Neve)
    surface: '#FFFFFF',      // Branco de Cards e Modais
    border: '#E5E7EB',       // BD: Cinza de Bordas e Divisórias
    divider: '#F3F4F6',      // Linhas divisórias leves
  },
}
```

---

## 3. Tipografia e Escala de Fontes

O app utiliza a fonte nativa do sistema operacional (`San Francisco` no iOS e `Roboto` no Android) para máxima fidelidade e desempenho:

| Token | Tamanho | Peso | Line Height | Uso Típico |
|---|---|---|---|---|
| `display` | 32px | Bold (700) | 38px | Saldo principal de pontos na Home |
| `titleLarge` | 24px | Bold (700) | 30px | Títulos de telas principais |
| `titleMedium` | 20px | SemiBold (600) | 26px | Títulos de seções e modais |
| `bodyLarge` | 16px | Regular / Medium | 24px | Texto de inputs e cartões de loja |
| `bodyMedium` | 14px | Regular (400) | 20px | Descrições de extrato e subtítulos |
| `caption` | 12px | Regular / Medium | 16px | Timestamps, CNPJ, badges e rodapés |

---

## 4. Componentes Base e Padrões de Interface

### 4.1. Cartão de Saldo do Consumidor (`BalanceCard`)
- Fundo em degradê ou verde primário sólido (`#008D4C`).
- Tipografia em branco para alto contraste.
- Exibição destacada do total de pontos com o símbolo dourado `🪙 pts`.
- Contador de lojas credenciadas onde o usuário possui saldo ativo.

### 4.2. Visor da Câmera / Scanner (`QRScannerViewfinder`)
- Moldura quadrada centralizada com cantos arredondados destacados em verde fluorescente.
- Animação de varredura laser contínua via React Native Reanimated.
- Botão inferior para ligar/desligar lanterna (*Torch*).
- Atalho textual para digitar chave manualmente caso o QR Code esteja ilegível.

### 4.3. Simulador de Regras do Lojista (`RuleSimulatorInput`)
- Campo monetário com formatação BRL automática (`R$ 0,00`).
- Atualização em tempo real do cálculo de pontos gerados através de debounce de 300ms.
- Exibição de frase humana gerada pelo motor (ex: *"A cada R$ 10,00 você ganha 1 ponto"*).

### 4.4. Tratamento de Notches e Safe Area
Todos os layouts de tela utilizam `SafeAreaView` de `react-native-safe-area-context` para garantir que elementos interativos não fiquem sobrepostos à barra de status ou ao indicador de início do iOS.
