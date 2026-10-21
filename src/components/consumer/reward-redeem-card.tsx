import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { formatDiscountValue, Reward } from '@/services/rewards.service';

export interface RewardRedeemCardProps {
  reward: Reward;
  onRedeem: (reward: Reward) => void;
  isRedeeming?: boolean;
  isStoreInactive?: boolean;
  userBalance?: number;
}

export function RewardRedeemCard({
  reward,
  onRedeem,
  isRedeeming = false,
  isStoreInactive = false,
  userBalance,
}: RewardRedeemCardProps) {
  const isOutOfStock = reward.stock !== null && reward.stock !== undefined && reward.stock <= 0;
  const hasInsufficientPoints =
    userBalance !== undefined && userBalance < reward.pointsCost;

  const formattedDiscount = formatDiscountValue(reward);
  const isPercentage = reward.discountType === 'PERCENTAGE';

  const stockLabel =
    reward.stock === null || reward.stock === undefined
      ? 'Ilimitado'
      : reward.stock <= 0
        ? 'Esgotado (0)'
        : `${reward.stock} disponíveis`;

  const isDisabled = isStoreInactive || isOutOfStock || isRedeeming || hasInsufficientPoints;

  return (
    <View
      testID={`reward-redeem-card-${reward.id}`}
      className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-4"
    >
      {/* Topo: Custo em Pontos e Desconto */}
      <View className="flex-row items-center justify-between mb-3">
        {/* Badge Dourado/Roxo de Custo em Pontos */}
        <View className="bg-consumidor/10 border border-consumidor/20 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
          <Ionicons name="sparkles" size={13} color="#F5B800" />
          <Text className="text-consumidor text-xs font-black">
            {reward.pointsCost} pts
          </Text>
        </View>

        {/* Badge do Valor do Desconto */}
        <View className="bg-consumidor px-3 py-1.5 rounded-2xl flex-row items-center gap-1">
          <Ionicons name="pricetag" size={12} color="#FFFFFF" />
          <Text className="text-white text-xs font-extrabold">
            {formattedDiscount}
          </Text>
        </View>
      </View>

      {/* Título e Descrição */}
      <Text className="text-base font-extrabold text-neutros-texto mb-1">
        {reward.title}
      </Text>
      {Boolean(reward.description) && (
        <Text
          numberOfLines={2}
          className="text-xs text-neutros-cinza leading-relaxed mb-3"
        >
          {reward.description}
        </Text>
      )}

      {/* Metadados: Estoque, Validade e Condições */}
      <View className="flex-row flex-wrap items-center gap-3 pt-2.5 pb-3 border-t border-neutros-fundo">
        <View className="flex-row items-center gap-1">
          <Ionicons
            name="cube-outline"
            size={14}
            color={isOutOfStock ? '#DC2626' : '#60646C'}
          />
          <Text
            className={`text-[11px] ${
              isOutOfStock ? 'text-red-600 font-bold' : 'text-neutros-cinza'
            }`}
          >
            {stockLabel}
          </Text>
        </View>

        {Boolean(reward.validityDays) && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={14} color="#60646C" />
            <Text className="text-[11px] text-neutros-cinza">
              Válido por {reward.validityDays} dias
            </Text>
          </View>
        )}

        {Boolean(reward.minPurchaseAmount && reward.minPurchaseAmount > 0) && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="cart-outline" size={14} color="#60646C" />
            <Text className="text-[11px] text-neutros-cinza">
              Mín: R$ {Number(reward.minPurchaseAmount).toFixed(2).replace('.', ',')}
            </Text>
          </View>
        )}

        {isPercentage && Boolean(reward.maxDiscountAmount) && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="shield-outline" size={14} color="#60646C" />
            <Text className="text-[11px] text-neutros-cinza">
              Teto: R$ {Number(reward.maxDiscountAmount).toFixed(2).replace('.', ',')}
            </Text>
          </View>
        )}
      </View>

      {/* Aviso de Saldo Insuficiente quando aplicável */}
      {hasInsufficientPoints && !isStoreInactive && !isOutOfStock && (
        <View className="mb-3 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 flex-row items-center gap-1.5">
          <Ionicons name="information-circle-outline" size={15} color="#D97706" />
          <Text className="text-[11px] font-semibold text-amber-700 flex-1">
            Saldo insuficiente nesta loja (Você tem {userBalance} pts de {reward.pointsCost} pts).
          </Text>
        </View>
      )}

      {/* Botão de Resgate Atômico (ADR-003) */}
      <TouchableOpacity
        onPress={() => onRedeem(reward)}
        disabled={isDisabled}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Resgatar cupom ${reward.title} por ${reward.pointsCost} pontos`}
        testID={`redeem-button-${reward.id}`}
        className={`w-full h-12 rounded-2xl items-center justify-center flex-row gap-2 ${
          isDisabled
            ? 'bg-zinc-200'
            : 'bg-consumidor shadow-sm shadow-consumidor/20'
        }`}
      >
        {isRedeeming ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons
              name="ticket-outline"
              size={18}
              color={isDisabled ? '#9CA3AF' : '#FFFFFF'}
            />
            <Text
              className={`text-sm font-extrabold ${
                isDisabled ? 'text-zinc-500' : 'text-white'
              }`}
            >
              {isStoreInactive
                ? 'Resgates bloqueados na loja'
                : isOutOfStock
                  ? 'Cupom Esgotado'
                  : hasInsufficientPoints
                    ? 'Saldo Insuficiente'
                    : `Resgatar por ${reward.pointsCost} pts`}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
