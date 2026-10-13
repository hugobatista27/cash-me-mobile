import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (url: string) => void;
}

const { width } = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(width * 0.72, 280);

export function QrScannerModal({ visible, onClose, onScan }: QrScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || !data) return;
    setScanned(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignora erro em ambientes sem haptics
    }

    try {
      await Clipboard.setStringAsync(data);
    } catch {
      // Fallback silencioso
    }

    onScan(data);
    setTimeout(() => {
      setScanned(false);
      onClose();
    }, 300);
  };

  const handleClose = () => {
    setScanned(false);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-black">
        {!permission ? (
          <View className="flex-1 items-center justify-center p-8 gap-4">
            <Text className="text-white text-base font-bold">
              Verificando permissões...
            </Text>
          </View>
        ) : !permission.granted ? (
          <View className="flex-1 items-center justify-center p-8 gap-4">
            <Ionicons name="camera-outline" size={54} color="#FFFFFF" />
            <Text className="text-white text-xl font-bold text-center">
              Permissão da Câmera
            </Text>
            <Text className="text-zinc-400 text-sm text-center max-w-xs leading-relaxed">
              Precisamos de acesso à câmera para escanear QR codes da sua NFC-e.
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              activeOpacity={0.8}
              className="w-full h-14 bg-consumidor rounded-2xl items-center justify-center mt-2"
            >
              <Text className="text-white font-bold text-base">Conceder Permissão</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              className="py-3 items-center justify-center"
            >
              <Text className="text-zinc-400 font-bold text-sm">Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 relative">
            <CameraView
              style={{ flex: 1 }}
              facing={facing}
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Overlay com corte transparente no centro */}
            <SafeAreaView className="absolute inset-0 justify-between p-5">
              {/* Controles do Topo */}
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={handleClose}
                  activeOpacity={0.7}
                  className="w-11 h-11 rounded-full bg-black/50 items-center justify-center border border-white/20"
                >
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => setTorch((prev) => !prev)}
                    activeOpacity={0.7}
                    className={`w-11 h-11 rounded-full items-center justify-center border ${
                      torch ? 'bg-pontos border-pontos' : 'bg-black/50 border-white/20'
                    }`}
                  >
                    <Ionicons
                      name={torch ? 'flash' : 'flash-outline'}
                      size={20}
                      color={torch ? '#171717' : '#FFFFFF'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
                    activeOpacity={0.7}
                    className="w-11 h-11 rounded-full bg-black/50 items-center justify-center border border-white/20"
                  >
                    <Ionicons name="camera-reverse-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Guia de Enquadramento */}
              <View className="items-center justify-center my-auto">
                <View
                  style={{ width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE }}
                  className="relative rounded-3xl border border-white/40 items-center justify-center bg-black/10"
                >
                  <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-consumidor rounded-tl-2xl" />
                  <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-consumidor rounded-tr-2xl" />
                  <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-consumidor rounded-bl-2xl" />
                  <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-consumidor rounded-br-2xl" />
                </View>
                <Text className="text-white/90 text-xs font-semibold bg-black/70 px-4 py-2 rounded-full mt-4">
                  Aponte para o QR Code da NFC-e
                </Text>
              </View>

              {/* Status rodapé */}
              <View className="items-center pb-4">
                {scanned && (
                  <View className="bg-consumidor px-5 py-2.5 rounded-full shadow-lg">
                    <Text className="text-white font-bold text-xs">
                      ✓ QR Code Detectado!
                    </Text>
                  </View>
                )}
              </View>
            </SafeAreaView>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
