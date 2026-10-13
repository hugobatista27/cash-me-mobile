import {
  parseNfceContent,
  isValidSefazUrl,
  extractAccessKey,
  isIssuedWithin48Hours,
  formatAccessKey,
  parseNfceHtml,
  formatCurrency,
  parseBrlNumber,
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

  describe('formatCurrency e parseBrlNumber', () => {
    it('deve converter strings monetárias brasileiras para float', () => {
      expect(parseBrlNumber('R$ 1.250,90')).toBe(1250.9);
      expect(parseBrlNumber('12,50')).toBe(12.5);
      expect(parseBrlNumber('0,00')).toBe(0);
      expect(parseBrlNumber('')).toBe(0);
    });

    it('deve formatar números para padrão BRL', () => {
      const formatted = formatCurrency(1250.5);
      expect(formatted).toMatch(/1\.250,50/);
    });
  });

  describe('parseNfceHtml (Web Scraping SEFAZ)', () => {
    const mockHtml = `
      <html>
        <head><title>Consulta NFC-e SEFAZ</title></head>
        <body>
          <div class="txtTopo">Supermercado Alvorada Ltda</div>
          <div class="text">CNPJ: 12.345.678/0001-95</div>
          <span class="chave">4223 0912 3456 7800 0195 6500 1000 0001 2310 0000 1234</span>
          <span class="data">Emissão: 13/10/2026 15:30:00</span>
          
          <table id="tabResult">
            <tr>
              <td>
                <span class="txtTit">Café Torrado Especial 500g</span>
                <span class="RCod">(Código: 78910001)</span>
                <span class="Rqty">Qtde.: 2 UN</span>
                <span class="RvlUnit">Vl. Unit.: 18,50</span>
                <span class="valor">Vl. Total: 37,00</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="txtTit">Leite Integral 1L</span>
                <span class="RCod">(Código: 78910002)</span>
                <span class="Rqty">Qtde.: 3 UN</span>
                <span class="RvlUnit">Vl. Unit.: 5,50</span>
                <span class="valor">Vl. Total: 16,50</span>
              </td>
            </tr>
          </table>

          <label>Qtd. total de itens</label><span class="totalNumb">2</span>
          <label>Valor total</label><span class="totalNumb">53,50</span>
          <label>Desconto</label><span>3,50</span>
          <label>Valor a pagar</label><span class="txtMax">50,00</span>
          <div>Forma de Pagamento: Cartão de Crédito</div>
          <div>Consumidor CPF: 123.456.789-00</div>
        </body>
      </html>
    `;

    it('deve extrair emitente, chave de acesso e dados da nota', () => {
      const parsed = parseNfceHtml(mockHtml, 'https://sat.sef.sc.gov.br/nfce/consulta');
      expect(parsed.emitente.razaoSocial).toBe('Supermercado Alvorada Ltda');
      expect(parsed.emitente.cnpj).toBe('12.345.678/0001-95');
      expect(parsed.info.chaveAcesso).toBe(validAccessKey);
      expect(parsed.info.dataEmissao).toMatch(/13\/10\/2026/);
    });

    it('deve extrair itens individuais com preços e quantidades', () => {
      const parsed = parseNfceHtml(mockHtml);
      expect(parsed.itens).toHaveLength(2);
      expect(parsed.itens[0]).toEqual({
        codigo: '78910001',
        descricao: 'Café Torrado Especial 500g',
        quantidade: 2,
        unidade: 'UN',
        valorUnitario: 18.5,
        valorTotal: 37,
      });
      expect(parsed.itens[1].descricao).toBe('Leite Integral 1L');
      expect(parsed.itens[1].valorTotal).toBe(16.5);
    });

    it('deve extrair totais, desconto e forma de pagamento corretamente', () => {
      const parsed = parseNfceHtml(mockHtml);
      expect(parsed.totais.qtdItens).toBe(2);
      expect(parsed.totais.valorTotal).toBe(53.5);
      expect(parsed.totais.desconto).toBe(3.5);
      expect(parsed.totais.valorPagar).toBe(50.0);
      expect(parsed.totais.formaPagamento).toBe('Cartão de Crédito');
      expect(parsed.consumidor.documento).toBe('123.456.789-00');
    });

    it('deve extrair chave de acesso da URL caso não esteja no corpo HTML', () => {
      const minimalHtml = '<div>Total R$ 10,00</div>';
      const pageUrl = 'https://sat.sef.sc.gov.br/nfce/qrcode?p=42230912345678000195650010000001231000001234|2|1|1|...';
      const parsed = parseNfceHtml(minimalHtml, pageUrl);
      expect(parsed.info.chaveAcesso).toBe(validAccessKey);
    });
  });
});
