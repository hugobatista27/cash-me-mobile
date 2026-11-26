import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NfceResultView } from '@/components/NfceResultView';
import { SefazWebviewModal } from '@/components/SefazWebviewModal';
import { useProcessInvoice } from '@/hooks/useInvoices';
import { extractApiErrorMessage } from '@/services/api';
import {
  isIssuedWithin48Hours,
  NfceData,
  parseNfceContent,
  parsePtBrDateToIso,
} from '@/utils/nfceParser';

const DEFAULT_SEFAZ_SC_URL = 'https://sat.sef.sc.gov.br/nfce/consulta';
const DEFAULT_SEFAZ_PR_URL = 'https://www.fazenda.pr.gov.br/nfce/consulta';

interface ExtractedResultState {
  data: NfceData;
  pointsAwarded?: number;
  balance?: number;
  rawHtml?: string;
}

export default function ConsumerScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sefazModalUrl, setSefazModalUrl] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<ExtractedResultState | null>(null);

  const lastScannedCodeRef = useRef<string | null>(null);
  const processMutation = useProcessInvoice();

  // Animação da linha de escaneamento do viewfinder
  const [scanLineAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing) return;
    if (lastScannedCodeRef.current === data) return;

    lastScannedCodeRef.current = data;
    const parsed = parseNfceContent(data);

    if (!parsed.isValid || !parsed.accessKey) {
      Alert.alert(
        'QR Code Inválido ou Não Suportado',
        parsed.errorMessage || 'Não foi possível validar este QR Code como uma NFC-e homologada.',
        [
          {
            text: 'Tentar Novamente',
            onPress: () => {
              lastScannedCodeRef.current = null;
            },
          },
          {
            text: 'Digitar Manualmente',
            onPress: () => {
              lastScannedCodeRef.current = null;
              router.push('/(consumer)/scan-manual');
            },
          },
        ]
      );
      return;
    }

    const isUrl = data.trim().startsWith('http://') || data.trim().startsWith('https://');
    if (isUrl) {
      setSefazModalUrl(data.trim());
      return;
    }

    await Clipboard.setStringAsync(parsed.accessKey);
    const portalUrl =
      parsed.issuerState === 'PR' ? DEFAULT_SEFAZ_PR_URL : DEFAULT_SEFAZ_SC_URL;
    Alert.alert(
      'Chave Copiada',
      `Chave ${parsed.issuerState} copiada para a área de transferência. Cole no portal da SEFAZ para extrair os valores reais da nota.`,
      [
        {
          text: 'Abrir Portal SEFAZ',
          onPress: () => setSefazModalUrl(portalUrl),
        },
      ]
    );
  };

  const handleWebviewExtracted = async (data: NfceData, rawHtml: string) => {
    setSefazModalUrl(null);
    setIsProcessing(true);

    const accessKey = data.info.chaveAcesso.replace(/\D/g, '');
    const stateCode = accessKey.substring(0, 2);
    const issuerState = stateCode === '42' ? 'SC' : stateCode === '41' ? 'PR' : undefined;
    const issuerCnpj = data.emitente.cnpj.replace(/\D/g, '') || (accessKey.length === 44 ? accessKey.substring(6, 20) : '');
    const totalAmount = data.totais.valorPagar || data.totais.valorTotal || 0;
    const extractedIso = parsePtBrDateToIso(data.info.dataEmissao);

    let pointsAwarded: number | undefined;
    let balance: number | undefined;

    if (accessKey.length !== 44 || !issuerState || totalAmount <= 0) {
      setIsProcessing(false);
      lastScannedCodeRef.current = null;
      Alert.alert(
        'Extração Incompleta',
        'Não foi possível identificar a chave de 44 dígitos ou o valor total da nota na página da SEFAZ.'
      );
      setExtractedResult({ data, rawHtml });
      return;
    }

    if (data.info.dataEmissao && !isIssuedWithin48Hours(data.info.dataEmissao)) {
      setIsProcessing(false);
      lastScannedCodeRef.current = null;
      Alert.alert(
        'Nota Expirada (RN01)',
        'Esta nota fiscal foi emitida há mais de 48 horas e não é elegível para pontuação.'
      );
      setExtractedResult({ data, rawHtml });
      return;
    }

    try {
      const response = await processMutation.mutateAsync({
        accessKey,
        qrCodeUrl: data.url,
        issuerState,
        issuerCnpj,
        issuedAt: extractedIso || new Date().toISOString(),
        totalAmount,
        items: data.itens.map((item) => ({
          rawDescription: item.descricao,
          quantity: item.quantidade,
          unitPrice: item.valorUnitario,
          totalPrice: item.valorTotal,
        })),
      });

      if (response.status === 'REJECTED') {
        Alert.alert(
          'Nota Não Pontuada',
          response.rejectionReason
            ? `Motivo: ${response.rejectionReason}`
            : 'A nota foi extraída, mas rejeitada pelas regras de pontuação.'
        );
      } else {
        pointsAwarded = response.pointsAwarded;
        balance = response.balance?.currentBalance;
      }
    } catch (err: unknown) {
      const maybeAxios = err as {
        response?: { status?: number; data?: { code?: string; message?: string } };
      };
      const status = maybeAxios?.response?.status;
      const code = maybeAxios?.response?.data?.code;

      if (status === 409 || code === 'E_DUPLICATE_INVOICE') {
        Alert.alert(
          'Nota Já Pontuada (RN02)',
          'Esta nota fiscal já concedeu pontos anteriormente no Cash Me. Os produtos foram extraídos para sua conferência.'
        );
      } else {
        Alert.alert(
          'Erro ao Computar Pontos',
          extractApiErrorMessage(err, 'Não foi possível processar os pontos desta nota na API.')
        );
      }
    } finally {
      setIsProcessing(false);
      lastScannedCodeRef.current = null;
      setExtractedResult({
        data,
        rawHtml,
        pointsAwarded,
        balance,
      });
    }
  };

  // Se houver resultado detalhado extraído, renderiza a visualização rica da NFC-e
  if (extractedResult) {
    return (
      <SafeAreaView className="flex-1 bg-neutros-fundo">
        <NfceResultView
          data={extractedResult.data}
          pointsAwarded={extractedResult.pointsAwarded}
          balance={extractedResult.balance}
          rawHtml={extractedResult.rawHtml}
          onReset={() => {
            setExtractedResult(null);
            lastScannedCodeRef.current = null;
          }}
          onBackToWebView={() => {
            setSefazModalUrl(extractedResult.data.url || DEFAULT_SEFAZ_SC_URL);
            setExtractedResult(null);
          }}
          onGoToHome={() => router.replace('/(consumer)/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  // Se as permissões ainda estiverem carregando
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-neutros-fundo items-center justify-center p-6">
        <ActivityIndicator size="large" color="#008D4C" />
      </SafeAreaView>
    );
  }

  // Se a permissão não foi concedida
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-neutros-fundo justify-between p-6">
        {sefazModalUrl && (
          <SefazWebviewModal
            visible={Boolean(sefazModalUrl)}
            url={sefazModalUrl}
            onClose={() => {
              setSefazModalUrl(null);
              lastScannedCodeRef.current = null;
            }}
            onExtracted={handleWebviewExtracted}
          />
        )}
        <View className="items-center mt-12">
          <View className="w-20 h-20 rounded-3xl bg-consumidor/10 items-center justify-center mb-6">
            <Ionicons name="camera-outline" size={40} color="#008D4C" />
          </View>
          <Text className="text-2xl font-black text-neutros-texto text-center mb-2">
            Permissão de Câmera
          </Text>
          <Text className="text-sm text-neutros-cinza text-center leading-relaxed max-w-xs mb-8">
            Precisamos do acesso à câmera para ler o QR Code das suas notas fiscais de compra (NFC-e) e creditar seus pontos instantaneamente.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            activeOpacity={0.8}
            className="w-full h-14 bg-consumidor rounded-2xl items-center justify-center shadow-md shadow-consumidor/20 mb-4"
          >
            <Text className="text-white font-bold text-base">Permitir Acesso à Câmera</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-3 mb-4">
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setSefazModalUrl(DEFAULT_SEFAZ_SC_URL)}
              activeOpacity={0.7}
              className="flex-1 py-4 items-center justify-center border border-neutros-borda bg-white rounded-2xl flex-row gap-1.5"
            >
              <Ionicons name="globe-outline" size={16} color="#008D4C" />
              <Text className="text-neutros-texto font-bold text-xs">SEFAZ SC</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSefazModalUrl(DEFAULT_SEFAZ_PR_URL)}
              activeOpacity={0.7}
              className="flex-1 py-4 items-center justify-center border border-neutros-borda bg-white rounded-2xl flex-row gap-1.5"
            >
              <Ionicons name="globe-outline" size={16} color="#008D4C" />
              <Text className="text-neutros-texto font-bold text-xs">SEFAZ PR</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(consumer)/scan-manual')}
            activeOpacity={0.7}
            className="w-full py-4 items-center justify-center border border-neutros-borda bg-white rounded-2xl"
          >
            <Text className="text-neutros-texto font-bold text-sm">
              Digitar Chave Manualmente
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  return (
    <View className="flex-1 bg-black">
      {/* Modal SEFAZ WebView para resolução de CAPTCHA e extração */}
      {sefazModalUrl && (
        <SefazWebviewModal
          visible={Boolean(sefazModalUrl)}
          url={sefazModalUrl}
          onClose={() => {
            setSefazModalUrl(null);
            lastScannedCodeRef.current = null;
          }}
          onExtracted={handleWebviewExtracted}
        />
      )}

      {/* Visualizador da Câmera */}
      {Platform.OS !== 'web' ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={torchEnabled}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={isProcessing || Boolean(sefazModalUrl) ? undefined : handleBarcodeScanned}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-zinc-900">
          <Text className="text-white text-sm">Câmera não suportada no ambiente web.</Text>
        </View>
      )}

      {/* Overlay com Máscara e Viewfinder */}
      <SafeAreaView className="absolute inset-0 justify-between p-6">
        {/* Topo: Título e controles */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(consumer)/(tabs)'))}
            accessibilityLabel="Fechar"
            accessibilityRole="button"
            className="w-11 h-11 rounded-full bg-black/40 items-center justify-center border border-white/20"
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-xs font-bold text-pontos uppercase tracking-wider">
              Leitura NFC-e
            </Text>
            <Text className="text-base font-extrabold text-white">Escanear QR Code</Text>
          </View>

          <TouchableOpacity
            onPress={() => setTorchEnabled((prev) => !prev)}
            accessibilityLabel="Alternar Lanterna"
            accessibilityRole="button"
            className={`w-11 h-11 rounded-full items-center justify-center border ${
              torchEnabled ? 'bg-pontos border-pontos' : 'bg-black/40 border-white/20'
            }`}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-outline'}
              size={20}
              color={torchEnabled ? '#171717' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Centro: Retículo de enquadramento (Viewfinder) */}
        <View className="items-center justify-center my-auto">
          <View className="w-64 h-64 border-2 border-white/60 rounded-3xl relative overflow-hidden items-center justify-center">
            {/* Cantoneiras estilizadas */}
            <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-consumidor rounded-tl-2xl" />
            <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-consumidor rounded-tr-2xl" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-consumidor rounded-bl-2xl" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-consumidor rounded-br-2xl" />

            {/* Linha animada de varredura */}
            {!isProcessing && (
              <Animated.View
                style={{
                  transform: [{ translateY }],
                }}
                className="absolute top-0 left-2 right-2 h-0.5 bg-consumidor shadow-md shadow-consumidor"
              />
            )}

            {isProcessing && (
              <View className="bg-black/70 p-4 rounded-2xl items-center">
                <ActivityIndicator color="#008D4C" size="large" className="mb-2" />
                <Text className="text-white text-xs font-bold">Processando NFC-e...</Text>
              </View>
            )}
          </View>
          <Text className="text-white/80 text-xs text-center mt-4 max-w-xs font-medium">
            Aponte a câmera para o QR Code impresso no cupom fiscal (SC ou PR - RN07).
          </Text>
        </View>

        {/* Rodapé: Botões de Ação Alternativos */}
        <View className="gap-3 items-center pb-2">
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setSefazModalUrl(DEFAULT_SEFAZ_SC_URL)}
              activeOpacity={0.8}
              className="flex-row items-center gap-1.5 px-4 py-3 bg-white/95 rounded-2xl shadow-lg border border-white"
            >
              <Ionicons name="globe-outline" size={16} color="#008D4C" />
              <Text className="text-xs font-bold text-neutros-texto">SEFAZ SC</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSefazModalUrl(DEFAULT_SEFAZ_PR_URL)}
              activeOpacity={0.8}
              className="flex-row items-center gap-1.5 px-4 py-3 bg-white/95 rounded-2xl shadow-lg border border-white"
            >
              <Ionicons name="globe-outline" size={16} color="#008D4C" />
              <Text className="text-xs font-bold text-neutros-texto">SEFAZ PR</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(consumer)/scan-manual')}
            activeOpacity={0.8}
            className="flex-row items-center gap-2 px-6 py-3 bg-black/60 rounded-2xl border border-white/20"
          >
            <Ionicons name="keypad-outline" size={16} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">
              Digitar Chave de 44 Dígitos
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
