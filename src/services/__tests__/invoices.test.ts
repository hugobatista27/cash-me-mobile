import { apiClient } from '../api';
import {
  processInvoice,
  ProcessInvoicePayload,
  ProcessInvoiceResponse,
  getInvoiceDetails,
} from '../invoices';

jest.mock('../api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('InvoicesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPayload: ProcessInvoicePayload = {
    accessKey: '42230912345678000195650010000001231000001234',
    qrCodeUrl:
      'https://sat.sef.sc.gov.br/nfce/qrcode?p=42230912345678000195650010000001231000001234|2|1|1|...',
    issuerState: 'SC',
    issuerCnpj: '12345678000195',
  };

  const mockSuccessResponse: ProcessInvoiceResponse = {
    invoice: {
      id: 42,
      accessKey: '42230912345678000195650010000001231000001234',
      totalAmount: 150.0,
      status: 'PROCESSED',
    },
    pointsAwarded: 150,
    status: 'PROCESSED',
    rejectionReason: null,
    balance: {
      id: 10,
      currentBalance: 450,
      totalAccumulated: 450,
    },
    establishment: {
      id: 5,
      tradeName: 'Padaria Real',
      cnpj: '12345678000195',
    },
  };

  describe('processInvoice', () => {
    it('deve enviar payload para POST /customer/invoices/process e retornar dados computados', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockSuccessResponse,
      });

      const result = await processInvoice(mockPayload);

      expect(apiClient.post).toHaveBeenCalledWith('/customer/invoices/process', mockPayload);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('deve desembrulhar resposta encapsulada em { data: ... } caso a API retorne assim', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { data: mockSuccessResponse },
      });

      const result = await processInvoice(mockPayload);
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('getInvoiceDetails', () => {
    it('deve buscar os detalhes de uma nota fiscal por id via GET /customer/invoices/:id', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockSuccessResponse,
      });

      const result = await getInvoiceDetails(42);

      expect(apiClient.get).toHaveBeenCalledWith('/customer/invoices/42');
      expect(result).toEqual(mockSuccessResponse);
    });
  });
});
