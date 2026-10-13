import {
  parseNfceContent,
  isValidSefazUrl,
  extractAccessKey,
  isIssuedWithin48Hours,
  formatAccessKey,
} from '../nfceParser';

describe('nfceParser utility', () => {
  const validScUrl =
    'https://sat.sef.sc.gov.br/nfce/qrcode?p=42230912345678000195650010000001231000001234|2|1|1|...';
  const validPrUrl =
    'http://www.fazenda.pr.gov.br/nfce/qrcode?p=41230912345678000195650010000001231000001234|2|1|1|...';
  const spUrl =
    'https://www.nfce.fazenda.sp.gov.br/qrcode?p=35230912345678000195650010000001231000001234|2|1|1|...';
  const validAccessKey = '42230912345678000195650010000001231000001234';

  describe('extractAccessKey', () => {
    it('deve extrair a chave de 44 dígitos a partir de uma URL de QR Code', () => {
      const key = extractAccessKey(validScUrl);
      expect(key).toBe(validAccessKey);
    });

    it('deve extrair a chave de 44 dígitos a partir de texto puro ou chave digitada', () => {
      const key = extractAccessKey('  42230912345678000195650010000001231000001234  ');
      expect(key).toBe(validAccessKey);
    });

    it('deve retornar null se a chave não contiver 44 dígitos numéricos', () => {
      expect(extractAccessKey('12345')).toBeNull();
      expect(extractAccessKey('https://example.com/not-a-key')).toBeNull();
      expect(extractAccessKey('')).toBeNull();
    });
  });

  describe('isValidSefazUrl & Restrição Geográfica (RN07)', () => {
    it('deve aceitar domínios e chaves autorizados de Santa Catarina (SC - 42)', () => {
      expect(isValidSefazUrl(validScUrl)).toBe(true);
    });

    it('deve aceitar domínios e chaves autorizados do Paraná (PR - 41)', () => {
      expect(isValidSefazUrl(validPrUrl)).toBe(true);
    });

    it('deve rejeitar URLs de estados não homologados (ex: SP 35)', () => {
      expect(isValidSefazUrl(spUrl)).toBe(false);
    });

    it('deve rejeitar URLs maliciosas ou domínios não oficiais', () => {
      const phishingUrl =
        'https://fake-sef-sc.com/nfce/qrcode?p=42230912345678000195650010000001231000001234';
      expect(isValidSefazUrl(phishingUrl)).toBe(false);
      expect(isValidSefazUrl('not-a-url')).toBe(false);
    });
  });

  describe('isIssuedWithin48Hours (RN01)', () => {
    it('deve validar como verdadeira emissão dentro de 48 horas', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 horas atrás
      expect(isIssuedWithin48Hours(recent.toISOString())).toBe(true);
    });

    it('deve rejeitar emissão realizada há mais de 48 horas', () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 49 * 60 * 60 * 1000); // 49 horas atrás
      expect(isIssuedWithin48Hours(expired.toISOString())).toBe(false);
    });

    it('deve retornar true quando a data não for fornecida (validação delegada ao backend)', () => {
      expect(isIssuedWithin48Hours(undefined)).toBe(true);
      expect(isIssuedWithin48Hours(null)).toBe(true);
    });
  });

  describe('formatAccessKey (Máscara de 44 dígitos em blocos de 4)', () => {
    it('deve formatar 44 dígitos em 11 blocos de 4 dígitos', () => {
      const formatted = formatAccessKey(validAccessKey);
      expect(formatted).toBe('4223 0912 3456 7800 0195 6500 1000 0001 2310 0000 1234');
    });

    it('deve formatar chaves parciais corretamente', () => {
      expect(formatAccessKey('42230912')).toBe('4223 0912');
      expect(formatAccessKey('422309')).toBe('4223 09');
    });
  });

  describe('parseNfceContent (Fluxo integrado de parsing do QR Code ou texto)', () => {
    it('deve analisar com sucesso QR Code oficial de SC', () => {
      const result = parseNfceContent(validScUrl);
      expect(result.isValid).toBe(true);
      expect(result.accessKey).toBe(validAccessKey);
      expect(result.issuerState).toBe('SC');
      expect(result.issuerCnpj).toBe('12345678000195');
    });

    it('deve analisar com sucesso QR Code oficial do PR', () => {
      const result = parseNfceContent(validPrUrl);
      expect(result.isValid).toBe(true);
      expect(result.accessKey).toBe('41230912345678000195650010000001231000001234');
      expect(result.issuerState).toBe('PR');
      expect(result.issuerCnpj).toBe('12345678000195');
    });

    it('deve rejeitar QR Code de SP com mensagem informativa de estado não homologado', () => {
      const result = parseNfceContent(spUrl);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/apenas sc e pr/i);
    });

    it('deve analisar chave de 44 dígitos digitada manualmente', () => {
      const result = parseNfceContent(validAccessKey);
      expect(result.isValid).toBe(true);
      expect(result.accessKey).toBe(validAccessKey);
      expect(result.issuerState).toBe('SC');
      expect(result.issuerCnpj).toBe('12345678000195');
    });

    it('deve rejeitar chave inválida com menos de 44 dígitos', () => {
      const result = parseNfceContent('123456');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/44 dígitos/i);
    });
  });
});
