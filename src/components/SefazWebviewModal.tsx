import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { DOM_EXTRACTION_SCRIPT, NfceData, parseNfceHtml } from '@/utils/nfceParser';

interface SefazWebviewModalProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  onExtracted: (data: NfceData, rawHtml: string) => void;
}

export function SefazWebviewModal({
  visible,
  url,
  onClose,
  onExtracted,
}: SefazWebviewModalProps) {
  const webViewRef = useRef<WebView>(null);
  const [webViewLoading, setWebViewLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pageTitle, setPageTitle] = useState('Portal SEFAZ');

  const handleExtractNfce = () => {
    setExtracting(true);
    webViewRef.current?.injectJavaScript(DOM_EXTRACTION_SCRIPT);
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'NFCE_DOM_EXTRACTED') {
        const { html, title, url: finalUrl } = data.payload || {};
        if (title) setPageTitle(title);

        const parsed = parseNfceHtml(html || '', finalUrl || url);

        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Ignora erro em ambientes sem suporte
        }

        setExtracting(false);
        onExtracted(parsed, html || '');
      } else if (data.type === 'NFCE_EXTRACT_ERROR') {
        setExtracting(false);
        Alert.alert(
          'Erro na Extração',
          `Não foi possível ler o HTML da nota na página da SEFAZ: ${data.error}`
        );
      }
    } catch {
      setExtracting(false);
      Alert.alert(
        'Erro ao Processar',
        'Falha ao converter os dados da página da SEFAZ.'
      );
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-neutros-fundo" edges={['top', 'bottom']}>
        {/* Barra Superior / Header de Navegação */}
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-neutros-borda gap-3">
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={18} color="#171717" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-xs font-extrabold text-neutros-texto"
            >
              {pageTitle}
            </Text>
            <Text
              numberOfLines={1}
              className="text-[10px] text-neutros-cinza font-mono"
            >
              {url}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => webViewRef.current?.reload()}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
            accessibilityLabel="Recarregar Página"
          >
            <Ionicons name="reload" size={16} color="#171717" />
          </TouchableOpacity>
        </View>

        {/* Banner de Instrução do CAPTCHA */}
        <View className="flex-row items-center bg-[#1E3A5F] px-4 py-3 gap-3">
          <Text className="text-xl">🧩</Text>
          <View className="flex-1">
            <Text className="text-xs font-bold text-sky-200">
              Resolva o CAPTCHA se solicitado
            </Text>
            <Text className="text-[11px] text-sky-100 leading-snug">
              Interaja normalmente com a página. Quando os dados da nota aparecerem, clique no botão verde abaixo.
            </Text>
          </View>
        </View>

        {/* WebView */}
        <View className="flex-1 relative">
          {url ? (
            <WebView
              ref={webViewRef}
              source={{ uri: url }}
              className="flex-1"
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              onMessage={handleWebViewMessage}
              onError={(syntheticEvent) => {
                setWebViewLoading(false);
                Alert.alert(
                  'Erro ao carregar SEFAZ',
                  syntheticEvent.nativeEvent.description || 'Não foi possível carregar a página.'
                );
              }}
            />
          ) : null}

          {webViewLoading && (
            <View className="absolute inset-0 bg-black/30 items-center justify-center gap-2">
              <ActivityIndicator size="large" color="#008D4C" />
              <Text className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full">
                Carregando portal da SEFAZ...
              </Text>
            </View>
          )}
        </View>

        {/* Barra Flutuante de Extração */}
        <View className="p-4 bg-white border-t border-neutros-borda">
          <TouchableOpacity
            onPress={handleExtractNfce}
            disabled={extracting}
            activeOpacity={0.8}
            className={`w-full h-14 rounded-2xl items-center justify-center shadow-lg ${
              extracting ? 'bg-consumidor/70' : 'bg-consumidor shadow-consumidor/20'
            }`}
          >
            {extracting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white font-bold text-sm">
                  Extraindo Produtos e Valores...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold text-base">
                  Página Liberada? Extrair NFC-e
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
