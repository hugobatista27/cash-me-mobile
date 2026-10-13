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

export interface NfceItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
}

export interface NfceEmitente {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  endereco?: string;
  inscricaoEstadual?: string;
}

export interface NfceTotais {
  qtdItens: number;
  valorTotal: number;
  valorPagar: number;
  desconto?: number;
  formaPagamento?: string;
}

export interface NfceInfo {
  chaveAcesso: string;
  numero?: string;
  serie?: string;
  dataEmissao?: string;
  protocolo?: string;
}

export interface NfceConsumidor {
  documento?: string;
  nome?: string;
}

export interface NfceData {
  emitente: NfceEmitente;
  info: NfceInfo;
  itens: NfceItem[];
  totais: NfceTotais;
  consumidor: NfceConsumidor;
  url: string;
  scrapedAt: Date;
  rawHtmlLength: number;
}

/**
 * Utilitário para formatar moeda brasileira BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Converte strings de valor em formato brasileiro ("12,50" ou "R$ 1.250,90") para number
 */
export function parseBrlNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^\d,-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Remove tags HTML e decodifica entidades básicas
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>([\S\s]*?)<\/script>/gim, '')
    .replace(/<style[^>]*>([\S\s]*?)<\/style>/gim, '')
    .replace(/<[^>]+>/gm, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Script JS injetado na WebView para extração do DOM da SEFAZ
 */
export const DOM_EXTRACTION_SCRIPT = `
  (function() {
    try {
      var html = document.documentElement ? document.documentElement.outerHTML : '';
      var title = document.title || '';
      var url = window.location.href || '';
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'NFCE_DOM_EXTRACTED',
        payload: {
          html: html,
          title: title,
          url: url
        }
      }));
    } catch (err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'NFCE_EXTRACT_ERROR',
        error: String(err && err.message ? err.message : err)
      }));
    }
  })();
  true;
`;

/**
 * Parser de HTML da NFC-e da SEFAZ (extração de emitente, itens e totais)
 */
export function parseNfceHtml(html: string, pageUrl: string = ''): NfceData {
  const plainText = stripHtml(html);

  // 1. Extração da Chave de Acesso (44 dígitos numéricos)
  let chaveAcesso = '';
  const chaveMatch =
    html.match(
      /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/
    ) || plainText.match(/(\d{44})/);

  if (chaveMatch) {
    chaveAcesso = chaveMatch[1].replace(/[\s-]/g, '');
  } else if (pageUrl) {
    const urlChaveMatch = pageUrl.match(/(?:p=|chNFe=|chave=)(\d{44})/i);
    if (urlChaveMatch) {
      chaveAcesso = urlChaveMatch[1];
    }
  }

  // 2. Extração do Emitente (Razão Social e CNPJ)
  let cnpj = '';
  const cnpjMatch =
    html.match(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/) ||
    plainText.match(/CNPJ[:\s]*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i);
  if (cnpjMatch) {
    cnpj = cnpjMatch[1];
  }

  let razaoSocial = '';
  const topoMatch =
    html.match(
      /class=["'][^"']*(?:txtTopo|nomeEmpresa|razaoSocial|u20)[^"']*["'][^>]*>([^<]+)/i
    ) || html.match(/<h[1-4][^>]*>([^<]{3,80})<\/h[1-4]>/i);
  if (topoMatch) {
    razaoSocial = stripHtml(topoMatch[1]);
  }
  if (!razaoSocial && cnpj) {
    const idx = plainText.indexOf(cnpj);
    if (idx > 10) {
      const snippet = plainText.substring(Math.max(0, idx - 100), idx).trim();
      const parts = snippet.split(/\s{2,}|\n| - /);
      razaoSocial = parts[parts.length - 1] || 'Empresa Identificada por CNPJ';
    }
  }
  if (!razaoSocial) razaoSocial = 'Estabelecimento Comercial';

  // 3. Extração dos Itens da NFC-e
  const itens: NfceItem[] = [];
  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
  if (trMatches && trMatches.length > 0) {
    for (const tr of trMatches) {
      if (tr.includes('<th') && !tr.includes('<td')) continue;

      const descMatch =
        tr.match(
          /class=["'][^"']*(?:txtTit|descricao|nome)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
        ) || tr.match(/<span[^>]*class=["']txtTit["'][^>]*>([\s\S]*?)<\/span>/i);

      const codMatch =
        tr.match(
          /class=["'][^"']*(?:RCod|codigo)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
        ) || tr.match(/\(Código[:\s]*(\d+)\)/i);

      const qtdMatch =
        tr.match(
          /class=["'][^"']*(?:Rqty|qtd|quantidade)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
        ) || tr.match(/Qtde?\.?[:\s]*([\d.,]+)/i);

      const unMatch =
        tr.match(
          /class=["'][^"']*(?:RUN|unidade)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
        ) ||
        tr.match(/\bQtde?\.?[:\s]*[\d.,]+\s*([A-Z]{2,4})\b/i) ||
        tr.match(/\bUN[:\s]*([A-Z]{2,4})\b/i);

      const vlUnitMatch =
        tr.match(
          /class=["'][^"']*(?:RvlUnit|vlUnit|unitario)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
        ) || tr.match(/Vl\.?\s*Unit\.?[:\s]*([\d.,]+)/i);

      const vlTotalMatch =
        tr.match(
          /class=["'][^"']*(?:valor|Rval|total)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|td|div)>/i
        ) || tr.match(/Vl\.?\s*Total[:\s]*([\d.,]+)/i);

      if (descMatch || vlTotalMatch) {
        const desc = descMatch ? stripHtml(descMatch[1]) : 'Item sem descrição';
        const rawCod = codMatch ? stripHtml(codMatch[1]).replace(/[^\d]/g, '') : '';
        const rawQtd = qtdMatch ? stripHtml(qtdMatch[1]) : '1';
        const un = unMatch ? stripHtml(unMatch[1]) : 'UN';
        const rawVlUnit = vlUnitMatch ? stripHtml(vlUnitMatch[1]) : '0';
        const rawVlTotal = vlTotalMatch ? stripHtml(vlTotalMatch[1]) : '0';

        const qtd = parseBrlNumber(rawQtd) || 1;
        const vlTotal = parseBrlNumber(rawVlTotal);
        const vlUnit = parseBrlNumber(rawVlUnit) || (qtd > 0 && vlTotal > 0 ? vlTotal / qtd : 0);

        if (desc && (vlTotal > 0 || desc.length > 2)) {
          itens.push({
            codigo: rawCod || String(itens.length + 1),
            descricao: desc,
            quantidade: qtd,
            unidade: un.trim() || 'UN',
            valorUnitario: vlUnit,
            valorTotal: vlTotal,
          });
        }
      }
    }
  }

  // 4. Totais da Nota
  let valorTotal = 0;
  let valorPagar = 0;
  let desconto = 0;
  let formaPagamento = 'Não informada';
  let qtdItensParsed = 0;

  const qtdItensMatch =
    html.match(
      /(?:Qtd\.?\s*total\s*de\s*itens|Quantidade\s*total)[^<]*<\/label>[\s\S]*?<span[^>]*class=["'][^"']*totalNumb[^"']*["'][^>]*>([\d.,]+)<\/span>/i
    ) ||
    html.match(/(?:Qtd\.?\s*total\s*de\s*itens|Quantidade\s*total)[:\s]*<[^>]+>([\d.,]+)/i) ||
    plainText.match(/(?:Qtd\.?\s*total\s*de\s*itens|Quantidade\s*total)[:\s]*(\d+)/i);

  if (qtdItensMatch) {
    qtdItensParsed = parseInt(qtdItensMatch[1].replace(/[^\d]/g, ''), 10) || 0;
  }

  const descontoMatch =
    html.match(/(?:Desconto|Descontos)[^<]*<\/label>[\s\S]*?<span[^>]*>([\d.,]+)<\/span>/i) ||
    plainText.match(/(?:Desconto|Descontos\s*R\$)[:\s]*(?:R\$)?\s*([\d.,]+)/i);

  if (descontoMatch) {
    desconto = parseBrlNumber(descontoMatch[1]);
  }

  const valorPagarMatch =
    html.match(
      /(?:Valor\s+a\s+pagar)[^<]*<\/label>[\s\S]*?<span[^>]*class=["'][^"']*(?:txtMax|totalNumb)[^"']*["'][^>]*>([\d.,]+)<\/span>/i
    ) ||
    html.match(/(?:Valor\s+a\s+pagar)[^<]*<\/label>[\s\S]*?<span[^>]*>([\d.,]+)<\/span>/i) ||
    html.match(/class=["'][^"']*\btxtMax\b[^"']*["'][^>]*>([\d.,]+)<\/span>/i) ||
    plainText.match(/(?:Valor\s+a\s+pagar)[:\s]*(?:R\$)?\s*([\d.,]{3,})/i);

  if (valorPagarMatch) {
    valorPagar = parseBrlNumber(valorPagarMatch[1]);
  }

  const valorTotalMatch =
    html.match(
      /(?:Valor\s+total)[^<]*<\/label>[\s\S]*?<span[^>]*class=["'][^"']*(?:txtMax|totalNumb)[^"']*["'][^>]*>([\d.,]+)<\/span>/i
    ) ||
    html.match(/(?:Valor\s+total)[^<]*<\/label>[\s\S]*?<span[^>]*>([\d.,]+)<\/span>/i) ||
    plainText.match(
      /(?:Valor\s+total(?:\s*R\$)?|Total\s+R\$|\bTotal da Nota\b)[:\s]*(?:R\$)?\s*([\d.,]{3,})/i
    );

  if (valorTotalMatch) {
    valorTotal = parseBrlNumber(valorTotalMatch[1]);
  }

  if (valorTotal === 0 && valorPagar > 0) {
    valorTotal = valorPagar;
  }
  if (valorPagar === 0 && valorTotal > 0) {
    valorPagar = valorTotal;
  }

  const sumItens = itens.reduce((acc, curr) => acc + curr.valorTotal, 0);
  if (sumItens > 0) {
    const isTotalSuspicious =
      valorTotal === 0 ||
      (qtdItensParsed > 0 && Math.abs(valorTotal - qtdItensParsed) < 0.001) ||
      (itens.length > 1 && Math.abs(valorTotal - itens.length) < 0.001) ||
      (valorTotal < sumItens * 0.25 && sumItens >= 5);

    if (isTotalSuspicious) {
      valorTotal = sumItens;
      if (
        valorPagar === 0 ||
        (qtdItensParsed > 0 && Math.abs(valorPagar - qtdItensParsed) < 0.001) ||
        (itens.length > 1 && Math.abs(valorPagar - itens.length) < 0.001)
      ) {
        valorPagar = desconto > 0 ? Math.max(0, sumItens - desconto) : sumItens;
      }
    }
  }

  const formasConhecidas = [
    'Cartão de Crédito',
    'Cartão de Débito',
    'Dinheiro',
    'PIX',
    'Boleto Bancário',
    'Boleto',
    'Vale Alimentação',
    'Vale Refeição',
    'Transferência Bancária',
  ];

  for (const forma of formasConhecidas) {
    if (new RegExp(forma, 'i').test(plainText)) {
      formaPagamento = forma;
      break;
    }
  }

  if (formaPagamento === 'Não informada') {
    const genericFormaMatch = plainText.match(
      /(?:Forma de Pagamento|Meio de Pagamento)[:\s]*([A-Za-zÀ-ÿ\s]{3,25})/i
    );
    if (genericFormaMatch) {
      formaPagamento = genericFormaMatch[1].trim();
    }
  }

  // 5. Informações da Nota (Número, Série, Emissão)
  const numMatch = plainText.match(/(?:Número|Nº)[:\s]*(\d+)/i);
  const serieMatch = plainText.match(/(?:Série)[:\s]*(\d+)/i);
  const dataMatch = plainText.match(
    /(?:Emissão|Data da Emissão)[:\s]*(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)/i
  );
  const protocoloMatch = plainText.match(/(?:Protocolo|Protocolo de autorização)[:\s]*(\d{10,20})/i);

  // 6. Consumidor
  const cpfConsumidorMatch = plainText.match(
    /Consumidor(?:\s+CPF)?[:\s]*(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})/i
  );

  const finalQtdItens =
    qtdItensParsed > 0
      ? qtdItensParsed
      : itens.length > 0
      ? itens.length
      : numMatch
      ? 1
      : 0;

  return {
    emitente: {
      razaoSocial,
      cnpj,
    },
    info: {
      chaveAcesso: chaveAcesso || 'Não identificada',
      numero: numMatch ? numMatch[1] : undefined,
      serie: serieMatch ? serieMatch[1] : undefined,
      dataEmissao: dataMatch ? dataMatch[1] : undefined,
      protocolo: protocoloMatch ? protocoloMatch[1] : undefined,
    },
    itens,
    totais: {
      qtdItens: finalQtdItens,
      valorTotal: valorTotal || valorPagar,
      valorPagar: valorPagar || valorTotal,
      desconto: desconto > 0 ? desconto : undefined,
      formaPagamento,
    },
    consumidor: {
      documento: cpfConsumidorMatch ? cpfConsumidorMatch[1] : 'Não identificado',
    },
    url: pageUrl,
    scrapedAt: new Date(),
    rawHtmlLength: html.length,
  };
}
