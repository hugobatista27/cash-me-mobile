/**
 * Utilitário de parsing e validação de NFC-e para o Cash Me (TASK-03).
 * Responsável por:
 * 1. Extração da chave de acesso de 44 dígitos (RN02).
 * 2. Validação de domínios SEFAZ autorizados para SC e PR (RN07).
 * 3. Validação temporal de 48 horas a partir da emissão (RN01).
 * 4. Formatação amigável da chave em blocos de 4 dígitos.
 */

export interface ParsedNfce {
  isValid: boolean;
  accessKey?: string;
  issuerState?: 'SC' | 'PR';
  issuerCnpj?: string;
  issuedAt?: string;
  qrCodeUrl?: string;
  errorMessage?: string;
}

// Domínios oficiais homologados pela SEFAZ de SC e PR (RN07)
const HOMOLOGATED_SEFAZ_HOSTS = [
  'sat.sef.sc.gov.br',
  'fazenda.pr.gov.br',
  'www.fazenda.pr.gov.br',
  'dfe.sefa.pr.gov.br',
];

// Código de UF nos dois primeiros dígitos da chave de acesso (IBGE)
export const STATE_IBGE_CODES: Record<string, 'SC' | 'PR'> = {
  '42': 'SC',
  '41': 'PR',
};

/**
 * Extrai a chave de 44 dígitos numéricos de qualquer texto ou URL.
 */
export const extractAccessKey = (input?: string | null): string | null => {
  if (!input) return null;
  const match = input.match(/\b([0-9]{44})\b/);
  if (match) {
    return match[1];
  }

  // Tenta encontrar em parâmetro após remover não-dígitos caso seja digitação direta
  const sanitized = input.replace(/\D/g, '');
  if (sanitized.length === 44) {
    return sanitized;
  }

  return null;
};

/**
 * Valida se uma URL pertence à SEFAZ oficial de SC ou PR e possui chave compatível (RN07).
 */
export const isValidSefazUrl = (urlStr?: string | null): boolean => {
  if (!urlStr) return false;

  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();

    const isHomologatedHost = HOMOLOGATED_SEFAZ_HOSTS.some(
      (validHost) => host === validHost || host.endsWith(`.${validHost}`)
    );

    if (!isHomologatedHost) {
      return false;
    }

    const key = extractAccessKey(urlStr);
    if (!key) {
      return false;
    }

    const stateCode = key.substring(0, 2);
    return stateCode === '41' || stateCode === '42';
  } catch {
    return false;
  }
};

/**
 * Valida a janela temporal de 48 horas para envio de notas (RN01).
 */
export const isIssuedWithin48Hours = (issuedAt?: string | null): boolean => {
  if (!issuedAt) {
    return true; // Se a data não vier na URL, a verificação cabe ao backend
  }

  const date = new Date(issuedAt);
  if (isNaN(date.getTime())) {
    return true;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours <= 48;
};

/**
 * Formata uma chave de 44 dígitos em blocos de 4 dígitos para exibição ou digitação manual.
 */
export const formatAccessKey = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 44);
  return digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

/**
 * Analisa o conteúdo completo do QR Code ou texto de chave digitada manualmente.
 */
export const parseNfceContent = (rawContent: string): ParsedNfce => {
  const trimmed = rawContent.trim();
  const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');

  if (isUrl) {
    const key = extractAccessKey(trimmed);
    if (!key) {
      return {
        isValid: false,
        errorMessage: 'Não foi possível identificar a chave de acesso de 44 dígitos no QR Code.',
      };
    }

    const stateCode = key.substring(0, 2);
    const issuerState = STATE_IBGE_CODES[stateCode];

    if (!issuerState || !isValidSefazUrl(trimmed)) {
      return {
        isValid: false,
        accessKey: key,
        errorMessage:
          'Estado não homologado. O Cash Me aceita apenas SC e PR nesta versão piloto (RN07).',
      };
    }

    // Estrutura padrão da chave: UF (2) + AAMM (4) + CNPJ (14) + MOD (2) + SERIE (3) + NUM (9) + TIPO (1) + COD (8) + DV (1)
    const issuerCnpj = key.substring(6, 20);

    return {
      isValid: true,
      accessKey: key,
      issuerState,
      issuerCnpj,
      qrCodeUrl: trimmed,
    };
  }

  // Entrada de chave manual (sem URL)
  const key = extractAccessKey(trimmed);
  if (!key) {
    return {
      isValid: false,
      errorMessage: 'A chave de acesso da NFC-e deve conter exatamente 44 dígitos numéricos.',
    };
  }

  const stateCode = key.substring(0, 2);
  const issuerState = STATE_IBGE_CODES[stateCode];

  if (!issuerState) {
    return {
      isValid: false,
      accessKey: key,
      errorMessage:
        'Estado não homologado. O Cash Me aceita apenas SC e PR nesta versão piloto (RN07).',
    };
  }

  const issuerCnpj = key.substring(6, 20);

  return {
    isValid: true,
    accessKey: key,
    issuerState,
    issuerCnpj,
  };
};
