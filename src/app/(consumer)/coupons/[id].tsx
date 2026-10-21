import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCancelCouponMutation, useCustomerCoupons } from '@/hooks/useCoupons';
import {
  formatCouponCode,
  isCouponActive,
} from '@/services/coupons.service';
import { formatCnpj } from '@/services/establishments';
import { formatDiscountValue } from '@/services/rewards.service';

export default function ConsumerCouponDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const couponId = params.id;

  const [copied, setCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: coupons = [], isLoading } = useCustomerCoupons();
  const cancelMutation = useCancelCouponMutation();

  const coupon = useMemo(() => {
    return coupons.find((c) => String(c.id) === String(couponId));
  }, [coupons, couponId]);

  const active = coupon ? isCouponActive(coupon) : false;
  const used = coupon?.status === 'USED';
  const cancelled = coupon?.status === 'CANCELLED';

  const formattedCode = formatCouponCode(coupon?.code);

  const handleCopyCode = async () => {
    if (!formattedCode) return;
    await Clipboard.setStringAsync(formattedCode);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelCoupon = () => {
    if (!coupon) return;

    Alert.alert(
      'Cancelar Cupom e Estornar Pontos',
      `Tem certeza que deseja cancelar este cupom?\n\nO código ${formattedCode} será invalidado imediatamente e os ${coupon.pointsCost} pontos serão estornados integralmente de volta à sua carteira (ADR-003).`,
      [
        { text: 'Manter Cupom', style: 'cancel' },
        {
          text: 'Sim, Cancelar e Estornar',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await cancelMutation.mutateAsync(coupon.id);
              Alert.alert(
                'Cupom Cancelado! 🔄',
                `Os ${coupon.pointsCost} pontos foram estornados integralmente para o seu saldo nesta loja.`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(consumer)/coupons'),
                  },
                ]
              );
            } catch (err: unknown) {
              const maybeAxios = err as { response?: { data?: { message?: string } } };
              const msg =
                maybeAxios?.response?.data?.message ||
                'Não foi possível cancelar o cupom. Verifique sua conexão e tente novamente.';
              Alert.alert('Erro ao Cancelar', msg);
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutros-fundo items-center justify-center p-6">
        <ActivityIndicator size="large" color="#008D4C" />
        <Text className="text-xs text-neutros-cinza font-semibold mt-3">
          Carregando informações do cupom...
        </Text>
      </SafeAreaView>
    );
  }

  if (!coupon) {
    return (
      <SafeAreaView className="flex-1 bg-neutros-fundo items-center justify-center p-8">
        <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
          <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
        </View>
        <Text className="text-base font-bold text-neutros-texto text-center">
          Cupom não encontrado
        </Text>
        <Text className="text-xs text-neutros-cinza text-center mt-1 mb-6">
          Não conseguimos localizar este cupom no seu histórico.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="px-6 py-3 bg-consumidor rounded-xl"
        >
          <Text className="text-white font-bold text-sm">Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const discountFormatted = formatDiscountValue({
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });

  const formattedExpiry = (() => {
    if (!coupon.expiresAt) return '';
    try {
      const date = new Date(coupon.expiresAt);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  })();

  const formattedCreated = (() => {
    if (!coupon.createdAt) return '';
    try {
      const date = new Date(coupon.createdAt);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  })();

  const storeName =
    coupon.establishment?.tradeName ||
    coupon.reward?.title ||
    'Estabelecimento Parceiro';
  const storeCnpj = coupon.establishment?.cnpj
    ? formatCnpj(coupon.establishment.cnpj)
    : '';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    formattedCode
  )}`;

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo" edges={['top']}>
      {/* Barra de Topo */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-neutros-borda/60 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={20} color="#171717" />
        </TouchableOpacity>

        <Text className="text-base font-extrabold text-neutros-texto flex-1 text-center px-3">
          Detalhes do Cupom
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerClassName="p-5 pb-16 gap-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Bilhete / Voucher com Picote Visual */}
        <View className="bg-white rounded-3xl border border-neutros-borda shadow-sm overflow-hidden">
          {/* Topo do Bilhete: Identificação da Loja e Desconto */}
          <View className="bg-consumidor p-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                  <Ionicons name="storefront" size={16} color="#FFFFFF" />
                </View>
                <Text
                  numberOfLines={1}
                  className="text-xs font-bold text-white/90 uppercase tracking-wider flex-1"
                >
                  {storeName}
                </Text>
              </View>

              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-extrabold">
                  {coupon.pointsCost} pts
                </Text>
              </View>
            </View>

            <Text className="text-white text-4xl font-black tracking-tight mb-1">
              {discountFormatted}
            </Text>

            {Boolean(coupon.reward?.title) && (
              <Text className="text-white/95 text-base font-bold">
                {coupon.reward?.title}
              </Text>
            )}

            {Boolean(storeCnpj) && (
              <Text className="text-white/70 text-[11px] font-mono mt-1">
                CNPJ: {storeCnpj}
              </Text>
            )}
          </View>

          {/* Picote Visual Divisório */}
          <View className="bg-white py-3 px-6 border-b border-dashed border-neutros-borda flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <View
                className={`w-2.5 h-2.5 rounded-full ${
                  active
                    ? 'bg-emerald-500'
                    : used
                      ? 'bg-blue-500'
                      : cancelled
                        ? 'bg-zinc-400'
                        : 'bg-amber-500'
                }`}
              />
              <Text className="text-xs font-extrabold text-neutros-texto">
                {active
                  ? 'Cupom Ativo para Uso'
                  : used
                    ? 'Cupom Já Utilizado'
                    : cancelled
                      ? 'Cupom Cancelado'
                      : 'Cupom Expirado'}
              </Text>
            </View>
            <Text className="text-[11px] text-neutros-cinza">
              {active ? `Vence em ${formattedExpiry}` : `Criado em ${formattedCreated}`}
            </Text>
          </View>

          {/* Área do Código e QR Code */}
          <View className="p-6 items-center">
            {active ? (
              <>
                <Text className="text-xs text-neutros-cinza text-center font-semibold mb-4">
                  Apresente o QR Code ou o código no caixa no ato da compra:
                </Text>

                {/* Container do QR Code */}
                <View className="p-4 bg-white rounded-3xl border-2 border-neutros-borda shadow-sm items-center justify-center mb-5">
                  <Image
                    source={{ uri: qrCodeUrl }}
                    style={{ width: 190, height: 190 }}
                    contentFit="contain"
                    accessibilityLabel={`QR Code do cupom ${formattedCode}`}
                  />
                  <View className="flex-row items-center gap-1 mt-2">
                    <Ionicons name="scan" size={13} color="#008D4C" />
                    <Text className="text-[11px] font-bold text-consumidor">
                      Válido para leitura ótica no caixa
                    </Text>
                  </View>
                </View>

                {/* Código em Destaque com Botão Copiar */}
                <View className="w-full bg-neutros-fundo p-4 rounded-2xl border border-neutros-borda flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-[10px] text-neutros-cinza uppercase font-bold tracking-wider">
                      Código de Desconto
                    </Text>
                    <Text
                      testID="coupon-code-display"
                      className="text-2xl font-mono font-black text-neutros-texto tracking-widest mt-0.5"
                    >
                      {formattedCode}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleCopyCode}
                    activeOpacity={0.75}
                    testID="copy-coupon-code-button"
                    className={`px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 border ${
                      copied
                        ? 'bg-emerald-100 border-emerald-300'
                        : 'bg-consumidor border-consumidor shadow-sm'
                    }`}
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text className="text-xs font-bold text-white">
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View className="py-6 items-center justify-center">
                <View
                  className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
                    used
                      ? 'bg-blue-100'
                      : cancelled
                        ? 'bg-zinc-200'
                        : 'bg-amber-100'
                  }`}
                >
                  <Ionicons
                    name={
                      used
                        ? 'checkmark-done-circle'
                        : cancelled
                          ? 'close-circle'
                          : 'alert-circle'
                    }
                    size={36}
                    color={used ? '#2563EB' : cancelled ? '#71717A' : '#D97706'}
                  />
                </View>
                <Text className="text-base font-bold text-neutros-texto text-center">
                  {used
                    ? 'Este cupom já foi utilizado no caixa'
                    : cancelled
                      ? 'Cupom cancelado com pontos estornados'
                      : 'Este cupom atingiu a data de validade'}
                </Text>
                <Text className="text-xs text-neutros-cinza text-center mt-1 max-w-xs">
                  {used
                    ? 'O desconto já foi aplicado em sua compra anterior nesta loja.'
                    : cancelled
                      ? 'Os pontos pagos foram estornados integralmente de volta à sua carteira.'
                      : 'Cupons não utilizados dentro do prazo expiram automaticamente.'}
                </Text>

                <View className="mt-4 px-4 py-2 bg-neutros-fundo rounded-xl border border-neutros-borda">
                  <Text className="text-xs font-mono font-bold text-neutros-cinza">
                    Código: {formattedCode}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Regras e Condições de Uso */}
        <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm gap-3">
          <Text className="text-xs font-bold text-neutros-texto uppercase tracking-wider">
            Regras de Utilização
          </Text>

          <View className="gap-2 pt-1">
            <View className="flex-row items-center justify-between py-1.5 border-b border-neutros-fundo">
              <Text className="text-xs text-neutros-cinza">Estabelecimento</Text>
              <Text className="text-xs font-bold text-neutros-texto">{storeName}</Text>
            </View>

            <View className="flex-row items-center justify-between py-1.5 border-b border-neutros-fundo">
              <Text className="text-xs text-neutros-cinza">Pontos Debitados</Text>
              <Text className="text-xs font-bold text-pontos">{coupon.pointsCost} pts</Text>
            </View>

            <View className="flex-row items-center justify-between py-1.5 border-b border-neutros-fundo">
              <Text className="text-xs text-neutros-cinza">Data do Resgate</Text>
              <Text className="text-xs font-medium text-neutros-texto">
                {formattedCreated || 'Recente'}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1.5 border-b border-neutros-fundo">
              <Text className="text-xs text-neutros-cinza">Validade Limite</Text>
              <Text className="text-xs font-bold text-neutros-texto">
                {formattedExpiry}
              </Text>
            </View>

            {Boolean(coupon.minPurchaseAmount && coupon.minPurchaseAmount > 0) && (
              <View className="flex-row items-center justify-between py-1.5 border-b border-neutros-fundo">
                <Text className="text-xs text-neutros-cinza">Compra Mínima</Text>
                <Text className="text-xs font-bold text-neutros-texto">
                  R$ {Number(coupon.minPurchaseAmount).toFixed(2).replace('.', ',')}
                </Text>
              </View>
            )}

            {Boolean(coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) && (
              <View className="flex-row items-center justify-between py-1.5">
                <Text className="text-xs text-neutros-cinza">Teto de Desconto</Text>
                <Text className="text-xs font-bold text-neutros-texto">
                  R$ {Number(coupon.maxDiscountAmount).toFixed(2).replace('.', ',')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Botão de Cancelamento Voluntário com Estorno Integral (ADR-003) */}
        {active && (
          <TouchableOpacity
            onPress={handleCancelCoupon}
            disabled={isCancelling}
            activeOpacity={0.8}
            testID="cancel-coupon-button"
            className="w-full py-4 rounded-2xl items-center justify-center border border-red-200 bg-red-50 flex-row gap-2 mt-1"
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Text className="text-red-700 font-extrabold text-sm">
                  Cancelar Cupom e Estornar Pontos
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
