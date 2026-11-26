import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SefazWebviewModal } from '@/components/SefazWebviewModal';
import { useProcessInvoice } from '@/hooks/useInvoices';
import { extractApiErrorMessage } from '@/services/api';
import {
  extractAccessKey,
  formatAccessKey,
  isIssuedWithin48Hours,
  NfceData,
  parseNfceContent,
  parsePtBrDateToIso,
} from '@/utils/nfceParser';

const DEFAULT_SEFAZ_SC_URL = 'https://sat.sef.sc.gov.br/nfce/consulta';
const DEFAULT_SEFAZ_PR_URL = 'https://www.fazenda.pr.gov.br/nfce/consulta';

export default function ConsumerScanManualScreen() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState('');
  const [sefazUrl, setSefazUrl] = useState<string | null>(null);
  const processMutation = useProcessInvoice();

  const digitsOnly = rawInput.replace(/\D/g, '').slice(0, 44);
  const isComplete = digitsOnly.length === 44;

  const handleChangeText = (text: string) => {
    const extracted = extractAccessKey(text);
    if (extracted) {
      setRawInput(extracted);
      return;
    }
    const cleaned = text.replace(/\D/g, '').slice(0, 44);
    setRawInput(cleaned);
  };

  const handleOpenSefazForManualKey = async () => {
    if (!isComplete) {
      Alert.alert(
        'Chave Incompleta',
        `A chave de acesso deve conter exatamente 44 dígitos numéricos (atualmente: ${digitsOnly.length}).`
      );
      return;
    }

    const parsed = parseNfceContent(digitsOnly);

    if (!parsed.isValid || !parsed.accessKey) {
      Alert.alert(
        'Chave Não Homologada (RN07)',
        parsed.errorMessage || 'Esta chave não pertence aos estados homologados (SC ou PR).'
      );
      return;
    }

    await Clipboard.setStringAsync(parsed.accessKey);
    const portalUrl =
      parsed.issuerState === 'PR' ? DEFAULT_SEFAZ_PR_URL : DEFAULT_SEFAZ_SC_URL;

    Alert.alert(
      'Chave Copiada',
      'A chave de 44 dígitos foi copiada. Cole no portal da SEFAZ, resolva o CAPTCHA se solicitado e clique em "Extrair NFC-e" para validar o valor e a data reais.',
      [
        {
          text: 'Abrir Portal SEFAZ',
          onPress: () => setSefazUrl(portalUrl),
        },
      ]
    );
  };

  const handleWebviewExtracted = async (data: NfceData) => {
    setSefazUrl(null);

    const extractedKey = data.info.chaveAcesso.replace(/\D/g, '');
    const accessKey = extractedKey.length === 44 ? extractedKey : digitsOnly;
    if (accessKey.length !== 44) {
      Alert.alert('Extração Incompleta', 'Não foi possível identificar a chave de 44 dígitos.');
      return;
    }

    const stateCode = accessKey.substring(0, 2);
    const issuerState = stateCode === '42' ? 'SC' : stateCode === '41' ? 'PR' : undefined;
    if (!issuerState) {
      Alert.alert('Estado Não Homologado (RN07)', 'Apenas NFC-es de SC e PR são aceitas.');
      return;
    }

    const totalAmount = data.totais.valorPagar || data.totais.valorTotal || 0;
    if (totalAmount <= 0) {
      Alert.alert(
        'Valor Não Identificado',
        'Não foi possível extrair o valor real da compra na página da SEFAZ.'
      );
      return;
    }

    if (data.info.dataEmissao && !isIssuedWithin48Hours(data.info.dataEmissao)) {
      Alert.alert(
        'Nota Expirada (RN01)',
        'Esta nota fiscal foi emitida há mais de 48 horas e não é elegível para pontuação.'
      );
      return;
    }

    const issuerCnpj = data.emitente.cnpj.replace(/\D/g, '') || accessKey.substring(6, 20);
    const issuedAt = parsePtBrDateToIso(data.info.dataEmissao) || new Date().toISOString();

    try {
      const response = await processMutation.mutateAsync({
        accessKey,
        issuerState,
        issuerCnpj,
        qrCodeUrl: data.url,
        issuedAt,
        totalAmount,
        items: data.itens.map((item) => ({
          rawDescription: item.descricao,
          quantity: item.quantidade,
          unitPrice: item.valorUnitario,
          totalPrice: item.valorTotal,
        })),
      });

      router.replace({
        pathname: '/(consumer)/invoice/[id]',
        params: {
          id: String(response.invoice.id),
          pointsAwarded: String(response.pointsAwarded),
          tradeName: response.establishment?.tradeName || 'Estabelecimento Parceiro',
          accessKey: response.invoice.accessKey,
          status: response.status,
          rejectionReason: response.rejectionReason || '',
        },
      });
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { status?: number; data?: { code?: string } } };
      if (
        maybeAxios?.response?.status === 409 ||
        maybeAxios?.response?.data?.code === 'E_DUPLICATE_INVOICE'
      ) {
        Alert.alert(
          'Nota Fiscal Já Processada (RN02)',
          'Esta NFC-e já foi pontuada anteriormente. Cada nota fiscal só pode conceder pontos uma única vez.'
        );
      } else {
        Alert.alert(
          'Erro ao Processar Nota',
          extractApiErrorMessage(err, 'Não foi possível validar e computar os pontos para esta nota.')
        );
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              className="w-11 h-11 rounded-full bg-white items-center justify-center border border-neutros-borda shadow-sm"
            >
              <Ionicons name="arrow-back" size={20} color="#171717" />
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-xs font-bold text-consumidor uppercase tracking-wider">
                Entrada Manual
              </Text>
              <Text className="text-base font-extrabold text-neutros-texto">Chave da NFC-e</Text>
            </View>

            <View className="w-11" />
          </View>

          {/* Card explicativo */}
          <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-6">
            <View className="w-12 h-12 rounded-2xl bg-consumidor/10 items-center justify-center mb-3">
              <Ionicons name="receipt-outline" size={24} color="#008D4C" />
            </View>
            <Text className="text-lg font-bold text-neutros-texto mb-1">
              Localize os 44 dígitos
            </Text>
            <Text className="text-xs text-neutros-cinza leading-relaxed">
              A chave de acesso está impressa no cupom fiscal próximo ao código de barras ou logo abaixo do QR Code. Validamos os dados reais diretamente no portal da SEFAZ.
            </Text>
          </View>

          {/* Campo de digitação com máscara */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold text-neutros-texto">
                Chave de Acesso (44 Dígitos)
              </Text>
              <Text
                className={`text-xs font-bold ${
                  isComplete ? 'text-consumidor' : 'text-neutros-cinza'
                }`}
              >
                {digitsOnly.length}/44
              </Text>
            </View>

            <TextInput
              className="w-full min-h-[96px] p-4 rounded-2xl bg-white border border-neutros-borda text-neutros-texto text-base font-semibold leading-relaxed tracking-wider"
              placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
              placeholderTextColor="#A3A3A3"
              keyboardType="numeric"
              multiline
              value={formatAccessKey(rawInput)}
              onChangeText={handleChangeText}
              autoFocus
            />

            <Text className="text-[11px] text-neutros-cinza mt-2">
              Regra RN07: Válido para estabelecimentos do Paraná (código 41) ou Santa Catarina (código 42).
            </Text>
          </View>

          {/* Botão de Consulta na SEFAZ e Processamento Real */}
          <TouchableOpacity
            onPress={handleOpenSefazForManualKey}
            disabled={!isComplete || processMutation.isPending}
            activeOpacity={0.8}
            className={`w-full h-14 rounded-2xl items-center justify-center shadow-lg ${
              isComplete && !processMutation.isPending
                ? 'bg-consumidor shadow-consumidor/20'
                : 'bg-zinc-300 shadow-none'
            }`}
          >
            {processMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-base">Consultar na SEFAZ e Pontuar</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Atalhos diretos para Portais SEFAZ SC/PR */}
          <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
              onPress={() => setSefazUrl(DEFAULT_SEFAZ_SC_URL)}
              activeOpacity={0.7}
              className="flex-1 py-4 items-center justify-center border border-neutros-borda bg-white rounded-2xl flex-row gap-1.5"
            >
              <Ionicons name="globe-outline" size={16} color="#008D4C" />
              <Text className="text-neutros-texto font-bold text-xs">Portal SEFAZ SC</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSefazUrl(DEFAULT_SEFAZ_PR_URL)}
              activeOpacity={0.7}
              className="flex-1 py-4 items-center justify-center border border-neutros-borda bg-white rounded-2xl flex-row gap-1.5"
            >
              <Ionicons name="globe-outline" size={16} color="#008D4C" />
              <Text className="text-neutros-texto font-bold text-xs">Portal SEFAZ PR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {sefazUrl && (
        <SefazWebviewModal
          visible={Boolean(sefazUrl)}
          url={sefazUrl}
          onClose={() => setSefazUrl(null)}
          onExtracted={handleWebviewExtracted}
        />
      )}
    </SafeAreaView>
  );
}
