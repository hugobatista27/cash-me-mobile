import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NfceResultView } from '../NfceResultView';
import { NfceData } from '@/utils/nfceParser';

describe('NfceResultView', () => {
  const mockNfceData: NfceData = {
    emitente: {
      razaoSocial: 'Padaria Central E2E Ltda',
      cnpj: '50.401.244/0001-54',
    },
    info: {
      chaveAcesso: '42230950401244000154650010000001231000001234',
      numero: '123',
      serie: '1',
      dataEmissao: '13/10/2026 14:00',
    },
    itens: [
      {
        codigo: '001',
        descricao: 'Pão Francês KG',
        quantidade: 1,
        unidade: 'KG',
        valorUnitario: 15.5,
        valorTotal: 15.5,
      },
      {
        codigo: '002',
        descricao: 'Café Espresso',
        quantidade: 2,
        unidade: 'UN',
        valorUnitario: 10.0,
        valorTotal: 20.0,
      },
    ],
    totais: {
      qtdItens: 2,
      valorTotal: 35.5,
      valorPagar: 35.5,
      formaPagamento: 'PIX',
    },
    consumidor: {
      documento: '701.670.445-91',
    },
    url: 'https://sat.sef.sc.gov.br/nfce/qrcode?p=123',
    scrapedAt: new Date(),
    rawHtmlLength: 1024,
  };

  it('deve renderizar dados do emitente, chave de acesso e total a pagar', () => {
    render(
      <NfceResultView
        data={mockNfceData}
        pointsAwarded={35}
        balance={120}
        onReset={jest.fn()}
      />
    );

    expect(screen.getByText('Padaria Central E2E Ltda')).toBeTruthy();
    expect(screen.getByText(/CNPJ: 50\.401\.244\/0001-54/)).toBeTruthy();
    expect(screen.getByText(/\+35/)).toBeTruthy();
    expect(screen.getByText(/Novo saldo na loja: 120 pts/)).toBeTruthy();
  });

  it('deve listar os itens da NFC-e corretamente', () => {
    render(
      <NfceResultView
        data={mockNfceData}
        onReset={jest.fn()}
      />
    );

    expect(screen.getByText('Pão Francês KG')).toBeTruthy();
    expect(screen.getByText('Café Espresso')).toBeTruthy();
  });

  it('deve acionar onReset ao clicar em Escanear Outra Nota', () => {
    const onResetMock = jest.fn();
    render(
      <NfceResultView
        data={mockNfceData}
        onReset={onResetMock}
      />
    );

    fireEvent.press(screen.getByText('Escanear Outra Nota'));
    expect(onResetMock).toHaveBeenCalledTimes(1);
  });
});
