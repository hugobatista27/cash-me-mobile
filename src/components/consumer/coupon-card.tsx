import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import {
  CouponRedemption,
  formatCouponCode,
  isCouponActive,
  isCouponExpired,
} from '@/services/coupons.service';
import { formatDiscountValue } from '@/services/rewards.service';

export interface CouponCardProps {
  coupon: CouponRedemption;
  onPress?: (coupon: CouponRedemption) => void;
}

export function CouponCard({ coupon, onPress }: CouponCardProps) {
  const [copied, setCopied] = useState(false);

  const active = isCouponActive(coupon);
  const expired = isCouponExpired(coupon);
  const used = coupon.status === 'USED';
  const cancelled = coupon.status === 'CANCELLED';

  const discountFormatted = formatDiscountValue({
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });

  const formattedCode = formatCouponCode(coupon.code);

  const handleCopyCode = async () => {
    if (!formattedCode) return;
    await Clipboard.setStringAsync(formattedCode);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics pode não estar disponível em emuladores/web
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedExpiry = (() => {
    if (!coupon.expiresAt) return '';
    try {
      const date = new Date(coupon.expiresAt);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  })();

  const statusConfig = (() => {
    if (active) {
      return {
        label: 'Ativo',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    }
    if (used) {
      return {
        label: 'Utilizado',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    }
    if (cancelled) {
      return {
        label: 'Cancelado',
        bg: 'bg-zinc-100',
        text: 'text-zinc-600',
        border: 'border-zinc-300',
        dot: 'bg-zinc-400',
      };
    }
    return {
      label: 'Expirado',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    };
  })();

  const storeName =
    coupon.establishment?.tradeName ||
    coupon.reward?.title ||
    'Estabelecimento Parceiro';

  return (
    <TouchableOpacity
      onPress={() => onPress?.(coupon)}
      activeOpacity={onPress ? 0.8 : 1}
      testID={`coupon-card-${coupon.id}`}
      className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-3.5"
    >
      {/* Topo: Loja e Status Badge */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <View className="w-8 h-8 rounded-xl bg-consumidor/10 items-center justify-center">
            <Ionicons name="storefront" size={16} color="#008D4C" />
          </View>
          <Text
            numberOfLines={1}
            className="text-xs font-bold text-neutros-cinza flex-1 uppercase tracking-wider"
          >
            {storeName}
          </Text>
        </View>

        <View
          className={`px-2.5 py-1 rounded-full border flex-row items-center gap-1.5 ${statusConfig.bg} ${statusConfig.border}`}
        >
          <View className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
          <Text className={`text-[11px] font-extrabold ${statusConfig.text}`}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Meio: Desconto e Título */}
      <View className="flex-row items-baseline justify-between mb-1">
        <Text className="text-2xl font-black text-consumidor">
          {discountFormatted}
        </Text>
        <Text className="text-xs font-bold text-pontos">
          {coupon.pointsCost} pts pagos
        </Text>
      </View>

      {Boolean(coupon.reward?.title) && (
        <Text
          numberOfLines={1}
          className="text-sm font-semibold text-neutros-texto mb-3"
        >
          {coupon.reward?.title}
        </Text>
      )}

      {/* Caixa do Código com Botão Copiar */}
      <View className="bg-neutros-fundo p-3 rounded-2xl border border-dashed border-neutros-borda flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-[10px] text-neutros-cinza font-bold uppercase tracking-wider">
            Código do Cupom
          </Text>
          <Text className="text-base font-mono font-black text-neutros-texto tracking-widest mt-0.5">
            {formattedCode}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCopyCode}
          activeOpacity={0.7}
          testID={`copy-code-btn-${coupon.id}`}
          className={`px-3 py-1.5 rounded-xl flex-row items-center gap-1 border ${
            copied
              ? 'bg-emerald-100 border-emerald-300'
              : 'bg-white border-neutros-borda shadow-2xs'
          }`}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={copied ? '#047857' : '#008D4C'}
          />
          <Text
            className={`text-xs font-bold ${
              copied ? 'text-emerald-700' : 'text-consumidor'
            }`}
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rodapé: Validade e Ver Detalhes */}
      <View className="flex-row items-center justify-between pt-2 border-t border-neutros-fundo">
        <View className="flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={13} color="#60646C" />
          <Text className="text-[11px] text-neutros-cinza">
            {expired
              ? `Expirou em ${formattedExpiry}`
              : `Válido até ${formattedExpiry}`}
          </Text>
        </View>

        <View className="flex-row items-center gap-0.5">
          <Text className="text-xs font-bold text-consumidor">Ver cupom</Text>
          <Ionicons name="chevron-forward" size={14} color="#008D4C" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
