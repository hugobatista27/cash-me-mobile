import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCustomerInvoiceDetail } from '@/hooks/useWallet';
import { formatTransactionDate } from '@/services/wallet.service';
import { formatAccessKey, formatCurrency } from '@/utils/nfceParser';

export default function ConsumerInvoiceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    pointsAwarded?: string;
    tradeName?: string;
    accessKey?: string;
    status?: string;
  }>();

  const invoiceId = params.id;
  const { data: invoiceData, isLoading } = useCustomerInvoiceDetail(invoiceId);

  // Valores priorizando a query de detalhes ou parâmetros de rota recebidos na navegação
  const points =
    invoiceData?.pointsAwarded ??
    invoiceData?.invoice?.pointsAwarded ??
    (params.pointsAwarded ? Number(params.pointsAwarded) : 0);

  const tradeName =
    invoiceData?.establishment?.tradeName ||
    params.tradeName ||
    'Estabelecimento Parceiro';

  const accessKey =
    invoiceData?.accessKey ||
    invoiceData?.invoice?.accessKey ||
    params.accessKey ||
    '';

  const totalAmount =
    invoiceData?.totalAmount ?? invoiceData?.invoice?.totalAmount;

  const status =
    invoiceData?.status ||
    invoiceData?.invoice?.status ||
    params.status ||
    'PROCESSED';

  const issuedAt =
    invoiceData?.issuedAt ||
    invoiceData?.invoice?.issuedAt ||
    invoiceData?.createdAt;

  const items = invoiceData?.items || invoiceData?.invoice?.items || [];
  const currentBalance = invoiceData?.balance?.currentBalance;

  const statusLabel =
    status === 'PROCESSED'
      ? 'Processada'
      : status === 'PENDING'
        ? 'Pendente'
        : 'Rejeitada';

  const statusColors =
    status === 'PROCESSED'
      ? { bg: 'bg-consumidor/10 border-consumidor/20', text: 'text-consumidor' }
      : status === 'PENDING'
        ? { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' }
        : { bg: 'bg-red-50 border-red-200', text: 'text-red-700' };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <ScrollView contentContainerClassName="p-6 pb-10">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity
            onPress={() => router.replace('/(consumer)/(tabs)')}
            accessibilityLabel="Fechar"
            accessibilityRole="button"
            className="w-11 h-11 rounded-full bg-white items-center justify-center border border-neutros-borda shadow-sm"
          >
            <Ionicons name="close" size={22} color="#171717" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-xs font-bold text-consumidor uppercase tracking-wider">
              NFC-e Processada
            </Text>
            <Text className="text-base font-extrabold text-neutros-texto">
              Comprovante
            </Text>
          </View>

          <View className="w-11" />
        </View>

        {isLoading && !params.pointsAwarded ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#008D4C" />
            <Text className="text-xs text-neutros-cinza mt-3 font-semibold">
              Carregando detalhes da nota...
            </Text>
          </View>
        ) : (
          <>
            {/* Card de Celebração de Pontos */}
            <View className="bg-consumidor p-8 rounded-3xl shadow-xl shadow-consumidor/30 items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-4 border border-white/30">
                <Ionicons name="checkmark-done" size={32} color="#FFFFFF" />
              </View>

              <Text className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                Pontos Creditados
              </Text>
              <Text className="text-white text-5xl font-black tracking-tight mb-2">
                +{points}{' '}
                <Text className="text-2xl font-bold text-pontos">pts</Text>
              </Text>

              <Text className="text-white/95 text-base font-bold text-center">
                {tradeName}
              </Text>

              {currentBalance !== undefined && (
                <View className="mt-4 px-4 py-1.5 rounded-full bg-white/15 border border-white/20">
                  <Text className="text-white text-xs font-semibold">
                    Novo saldo na loja: {currentBalance} pts
                  </Text>
                </View>
              )}
            </View>

            {/* Detalhes da Nota Fiscal */}
            <View className="bg-white p-6 rounded-3xl border border-neutros-borda shadow-sm mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-sm font-bold text-neutros-texto uppercase tracking-wider">
                  Informações da Nota Fiscal
                </Text>
                <View
                  className={`px-3 py-1 rounded-full border ${statusColors.bg}`}
                >
                  <Text className={`text-xs font-bold ${statusColors.text}`}>
                    {statusLabel}
                  </Text>
                </View>
              </View>

              <View className="space-y-4">
                <View className="mb-3">
                  <Text className="text-xs text-neutros-cinza mb-1">
                    Estabelecimento
                  </Text>
                  <Text className="text-sm font-bold text-neutros-texto">
                    {tradeName}
                  </Text>
                  {invoiceData?.establishment?.cnpj && (
                    <Text className="text-xs text-neutros-cinza mt-0.5">
                      CNPJ: {invoiceData.establishment.cnpj}
                    </Text>
                  )}
                </View>

                {totalAmount !== undefined && (
                  <View className="mb-3">
                    <Text className="text-xs text-neutros-cinza mb-1">
                      Valor Total da Compra
                    </Text>
                    <Text className="text-base font-black text-neutros-texto">
                      {formatCurrency(totalAmount)}
                    </Text>
                  </View>
                )}

                {issuedAt && (
                  <View className="mb-3">
                    <Text className="text-xs text-neutros-cinza mb-1">
                      Data de Registro
                    </Text>
                    <Text className="text-xs font-semibold text-neutros-texto">
                      {formatTransactionDate(issuedAt)}
                    </Text>
                  </View>
                )}

                <View className="pt-3 border-t border-neutros-borda">
                  <Text className="text-xs text-neutros-cinza mb-1">
                    Chave de Acesso (44 Dígitos)
                  </Text>
                  <Text className="text-xs font-mono font-medium text-neutros-texto leading-relaxed">
                    {formatAccessKey(accessKey) || 'Não informada'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Lista de Itens Adquiridos (quando extraídos da NFC-e) */}
            {items.length > 0 && (
              <View className="bg-white p-6 rounded-3xl border border-neutros-borda shadow-sm mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-sm font-bold text-neutros-texto uppercase tracking-wider">
                    Itens Adquiridos
                  </Text>
                  <Text className="text-xs font-bold text-neutros-cinza">
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </Text>
                </View>

                <View>
                  {items.map((item, idx) => {
                    const itemTitle =
                      item.description || item.rawDescription || 'Produto';
                    return (
                      <View
                        key={item.id ?? idx}
                        className={`py-3 flex-row items-center justify-between ${
                          idx < items.length - 1
                            ? 'border-b border-neutros-borda'
                            : ''
                        }`}
                      >
                        <View className="flex-1 pr-3">
                          <Text className="text-sm font-bold text-neutros-texto">
                            {itemTitle}
                          </Text>
                          <Text className="text-xs text-neutros-cinza mt-0.5">
                            {item.quantity}x {formatCurrency(item.unitPrice)}
                          </Text>
                        </View>
                        <Text className="text-sm font-extrabold text-neutros-texto">
                          {formatCurrency(item.totalPrice)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Botão de Conclusão */}
            <TouchableOpacity
              onPress={() => router.replace('/(consumer)/(tabs)')}
              activeOpacity={0.8}
              className="w-full h-14 bg-neutros-texto rounded-2xl items-center justify-center shadow-md mb-6"
            >
              <Text className="text-white font-bold text-base">
                Voltar para o Início
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
