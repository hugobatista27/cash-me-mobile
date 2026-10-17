import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export type RewardCardDiscountType = 'FIXED' | 'FIXED_AMOUNT' | 'PERCENTAGE';
export type RewardCardStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface RewardCardItem {
  id: string | number;
  title: string;
  description?: string | null;
  discountType: RewardCardDiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number | null;
  pointsCost: number;
  stock?: number | null;
  validityDays?: number;
  status: RewardCardStatus;
}

export interface RewardCardProps {
  reward: RewardCardItem;
  onToggleStatus?: (reward: RewardCardItem, nextStatus: 'ACTIVE' | 'INACTIVE') => void;
  isToggling?: boolean;
  onPress?: (reward: RewardCardItem) => void;
}

function formatBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}

export function RewardCard({
  reward,
  onToggleStatus,
  isToggling = false,
  onPress,
}: RewardCardProps) {
  const isActive = reward.status === 'ACTIVE';
  const isPercentage = reward.discountType === 'PERCENTAGE';
  const isOutOfStock = reward.stock !== null && reward.stock !== undefined && reward.stock <= 0;

  const formattedDiscount = isPercentage
    ? `${reward.discountValue}% OFF`
    : `${formatBRL(reward.discountValue)} OFF`;

  const discountTypeLabel = isPercentage ? 'Percentual (%)' : 'Valor Fixo (R$)';

  const stockLabel =
    reward.stock === null || reward.stock === undefined
      ? 'Ilimitado'
      : reward.stock <= 0
        ? 'Esgotado (0)'
        : `${reward.stock} un.`;

  const handleToggle = () => {
    if (!onToggleStatus || isToggling) return;
    const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    onToggleStatus(reward, nextStatus);
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      disabled={!onPress}
      onPress={() => onPress?.(reward)}
      testID={`reward-card-${reward.id}`}
      className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-4"
    >
      {/* Topo: Badges de Custo em Pontos (#6F35B5) e Status (#008D4C / Inativo) */}
      <View className="flex-row items-center justify-between mb-3">
        {/* Badge Roxo de Custo em Pontos (#6F35B5) */}
        <View
          style={{ backgroundColor: '#6F35B5' }}
          className="bg-lojista px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
        >
          <Ionicons name="sparkles" size={13} color="#F5B800" />
          <Text className="text-white text-xs font-extrabold">
            {reward.pointsCost} pts
          </Text>
        </View>

        {/* Badge de Status (Ativo em verde #008D4C / Inativo) */}
        <View
          style={{
            backgroundColor: isActive ? '#E7F5ED' : '#F3F4F6',
            borderColor: isActive ? '#008D4C' : '#E5E7EB',
          }}
          className="px-3 py-1 rounded-full border flex-row items-center gap-1.5"
        >
          <View
            style={{ backgroundColor: isActive ? '#008D4C' : '#9CA3AF' }}
            className="w-2 h-2 rounded-full"
          />
          <Text
            style={{ color: isActive ? '#008D4C' : '#666666' }}
            className="text-xs font-bold"
          >
            {isActive ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>

      {/* Título e Valor de Desconto */}
      <View className="flex-row items-start justify-between gap-3 mb-1.5">
        <View className="flex-1">
          <Text className="text-base font-extrabold text-neutros-texto">
            {reward.title}
          </Text>
          {reward.description ? (
            <Text
              numberOfLines={2}
              className="text-xs text-neutros-cinza leading-relaxed mt-1"
            >
              {reward.description}
            </Text>
          ) : null}
        </View>

        <View className="bg-lojista/10 px-3 py-2 rounded-2xl items-end border border-lojista/20">
          <Text className="text-sm font-black text-lojista">
            {formattedDiscount}
          </Text>
          <Text className="text-[10px] font-semibold text-neutros-cinza">
            {discountTypeLabel}
          </Text>
        </View>
      </View>

      {/* Metadados: Estoque, Validade e Regras */}
      <View className="flex-row flex-wrap items-center gap-4 pt-3 mt-3 border-t border-neutros-fundo">
        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name="cube-outline"
            size={15}
            color={isOutOfStock ? '#D64545' : '#666666'}
          />
          <Text className="text-xs text-neutros-cinza">Estoque:</Text>
          <Text
            className={`text-xs font-bold ${
              isOutOfStock ? 'text-red-600' : 'text-neutros-texto'
            }`}
          >
            {stockLabel}
          </Text>
        </View>

        {reward.validityDays ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={15} color="#666666" />
            <Text className="text-xs text-neutros-cinza">Validade:</Text>
            <Text className="text-xs font-bold text-neutros-texto">
              {reward.validityDays} {reward.validityDays === 1 ? 'dia' : 'dias'}
            </Text>
          </View>
        ) : null}

        {reward.minPurchaseAmount && reward.minPurchaseAmount > 0 ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="cart-outline" size={15} color="#666666" />
            <Text className="text-xs text-neutros-cinza">Mín:</Text>
            <Text className="text-xs font-bold text-neutros-texto">
              {formatBRL(reward.minPurchaseAmount)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Ação: Alternar Status (Toggle Status) */}
      {onToggleStatus && (
        <View className="mt-4 pt-3 border-t border-neutros-borda/60 flex-row items-center justify-between">
          <Text className="text-xs text-neutros-cinza">
            {isActive
              ? 'Disponível para resgate no catálogo'
              : 'Oculto no catálogo de clientes'}
          </Text>

          <TouchableOpacity
            onPress={handleToggle}
            disabled={isToggling}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isActive ? 'Desativar recompensa' : 'Ativar recompensa'}
            testID={`toggle-reward-status-${reward.id}`}
            style={{
              backgroundColor: isActive ? '#FEF2F2' : '#E7F5ED',
              borderColor: isActive ? '#FECACA' : '#008D4C',
            }}
            className="px-3.5 py-2 rounded-xl border flex-row items-center gap-1.5"
          >
            {isToggling ? (
              <ActivityIndicator
                size="small"
                color={isActive ? '#DC2626' : '#008D4C'}
              />
            ) : (
              <>
                <Ionicons
                  name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={16}
                  color={isActive ? '#DC2626' : '#008D4C'}
                />
                <Text
                  style={{ color: isActive ? '#DC2626' : '#008D4C' }}
                  className="text-xs font-bold"
                >
                  {isActive ? 'Desativar' : 'Ativar'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default RewardCard;
