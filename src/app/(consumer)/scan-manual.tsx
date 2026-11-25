import { Ionicons } from '@expo/vector-icons';
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
import { extractAccessKey, formatAccessKey, parseNfceContent } from '@/utils/nfceParser';

export default function ConsumerScanManualScreen() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState('');
  const [webviewOpen, setWebviewOpen] = useState(false);
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

  const handleProcessManualKey = async () => {
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

    try {
      const response = await processMutation.mutateAsync({
        accessKey: parsed.accessKey,
        issuerState: parsed.issuerState,
        issuerCnpj: parsed.issuerCnpj,
        qrCodeUrl:
          parsed.qrCodeUrl ||
          `https://sat.sef.sc.gov.br/nfce/qrcode?p=${parsed.accessKey}`,
        issuedAt: new Date().toISOString(),
        totalAmount: 100.0,
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
      const maybeAxios = err as { response?: { status?: number; data?: { code?: string; message?: string } } };
      const status = maybeAxios?.response?.status;
      const code = maybeAxios?.response?.data?.code;

      if (status === 409 || code === 'E_DUPLICATE_INVOICE') {
        Alert.alert(
          'Nota Fiscal Já Processada (RN02)',
          'Esta NFC-e já foi pontuada anteriormente. Cada nota fiscal só pode conceder pontos uma única vez.'
        );
      } else {
        Alert.alert(
          'Erro ao Processar Nota',
          extractApiErrorMessage(err, 'Não foi possível validar e computar os pontos para esta chave de acesso.')
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
              A chave de acesso está impressa no cupom fiscal próximo ao código de barras ou logo abaixo do QR Code.
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

          {/* Botão de Envio */}
          <TouchableOpacity
            onPress={handleProcessManualKey}
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
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-base">Processar e Ganhar Pontos</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Atalho para Abrir Portal SEFAZ SC via WebView */}
          <TouchableOpacity
            onPress={() => setWebviewOpen(true)}
            activeOpacity={0.7}
            className="w-full py-4 items-center justify-center border border-neutros-borda bg-white rounded-2xl flex-row gap-2 mt-4"
          >
            <Ionicons name="globe-outline" size={18} color="#008D4C" />
            <Text className="text-neutros-texto font-bold text-sm">
              🌐 Abrir Portal SEFAZ SC (com CAPTCHA)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {webviewOpen && (
        <SefazWebviewModal
          visible={webviewOpen}
          url="https://sat.sef.sc.gov.br/nfce/consulta"
          onClose={() => setWebviewOpen(false)}
          onExtracted={(data) => {
            setWebviewOpen(false);
            if (data.info.chaveAcesso) {
              setRawInput(data.info.chaveAcesso.replace(/\D/g, ''));
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
