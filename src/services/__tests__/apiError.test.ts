import { extractApiErrorMessage, extractApiFieldErrors } from '../api';

describe('API Error Extraction', () => {
  it('deve diagnosticar erro de rede sem err.response com mensagem clara', () => {
    const msg = extractApiErrorMessage(
      { isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' },
      'Falha genérica'
    );
    expect(msg).toMatch(/Não foi possível conectar ao servidor/);
  });

  it('deve diagnosticar timeout (ECONNABORTED)', () => {
    const msg = extractApiErrorMessage(
      { isAxiosError: true, code: 'ECONNABORTED', message: 'timeout' },
      'Falha genérica'
    );
    expect(msg).toMatch(/Tempo limite excedido/);
  });

  it('deve concatenar mensagens únicas de erros 422 e extrair mapa por campo', () => {
    const err = {
      response: {
        status: 422,
        data: {
          errors: [
            { field: 'user.email', message: 'Este e-mail já está cadastrado no sistema.' },
            { field: 'establishment.cnpj', message: 'Este CNPJ já está cadastrado no sistema.' },
          ],
        },
      },
    };

    const msg = extractApiErrorMessage(err, 'Fallback');
    const fields = extractApiFieldErrors(err);

    expect(msg).toContain('Este e-mail já está cadastrado');
    expect(msg).toContain('Este CNPJ já está cadastrado');
    expect(fields['user.email']).toBe('Este e-mail já está cadastrado no sistema.');
    expect(fields['establishment.cnpj']).toBe('Este CNPJ já está cadastrado no sistema.');
  });

  it('deve traduzir Invalid user credentials para português', () => {
    const msg = extractApiErrorMessage(
      {
        response: {
          status: 400,
          data: { errors: [{ message: 'Invalid user credentials' }] },
        },
      },
      'Fallback'
    );
    expect(msg).toBe('E-mail ou senha incorretos.');
  });

  it('deve informar erro HTTP 500 claramente', () => {
    const msg = extractApiErrorMessage(
      { response: { status: 500, data: 'Internal Server Error' } },
      'Fallback'
    );
    expect(msg).toMatch(/Erro interno no servidor \(HTTP 500\)/);
  });
});
