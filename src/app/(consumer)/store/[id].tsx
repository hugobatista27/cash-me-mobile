import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRedeemReward, useStoreRewards } from '@/hooks/useCoupons';
import { useStoreDetails } from '@/hooks/useStores';
import { useCustomerBalances } from '@/hooks/useWallet';
import { extractApiErrorMessage } from '@/services/api';
import { formatRewardDiscount, RewardItem } from '@/services/coupons';
import { formatConversionRule } from '@/services/stores';

export default function ConsumerStoreDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: store, isLoading: isLoadingStore } = useStoreDetails(id);
  const { data: rewards = [], isLoading: isLoadingRewards } = useStoreRewards(id);
  const { data: balances = [] } = useCustomerBalances();
  const redeemMutation = useRedeemReward();

  const storeBalance = balances.find((b) => String(b.establishmentId) === String(id));
  const currentPoints = Number(storeBalance?.currentBalance ?? 0);
  const isStoreInactive = store && store.status !== 'ACTIVE';

  const handleOpenMaps = () => {
    if (!store?.address) return;
    const query = encodeURIComponent(
      `${store.address.street}, ${store.address.number} - ${store.address.neighborhood}, ${store.address.city} - ${store.address.state}`
    );
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const handleOpenPhone = (phone?: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  };

  const handleOpenWhatsapp = (whatsapp?: string | null) => {
    if (!whatsapp) return;
    const digits = whatsapp.replace(/\D/g, '');
    const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
    Linking.openURL(`https://wa.me/${withCountry}`);
  };

  const handleRedeem = (reward: RewardItem) => {
    if (isStoreInactive) {
      Alert.alert(
        'Resgate Indisponível (RN11)',
        'Este estabelecimento está temporariamente inativo e não aceita novos resgates no momento.'
      );
      return;
    }

    if (currentPoints < reward.pointsCost) {
      Alert.alert(
        'Saldo Insuficiente',
        `Você possui ${currentPoints} pts nesta loja, mas esta recompensa custa ${reward.pointsCost} pts.`
      );
      return;
    }

    Alert.alert(
      'Confirmar Resgate',
      `Deseja trocar ${reward.pointsCost} pontos por "${reward.title}" (${formatRewardDiscount(reward)})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resgatar Cupom',
          onPress: async () => {
            try {
              const coupon = await redeemMutation.mutateAsync(reward.id);
              Alert.alert(
                'Cupom Gerado!',
                `Código: ${coupon.code}\nApresente este código no caixa para receber o desconto.`,
                [
                  { text: 'Fechar' },
                  {
                    text: 'Ver Meus Cupons',
                    onPress: () => router.push('/(consumer)/coupons'),
                  },
                ]
              );
            } catch (err: unknown) {
              Alert.alert(
                'Erro no Resgate',
                extractApiErrorMessage(err, 'Não foi possível concluir o resgate do cupom.')
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-neutros-borda/60">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(consumer)/(tabs)/stores'))}
          className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
        >
          <Ionicons name="arrow-back" size={20} color="#171717" />
        </TouchableOpacity>
        <Text className="text-base font-extrabold text-neutros-texto flex-1 text-center mx-2" numberOfLines={1}>
          {store?.tradeName || 'Detalhes da Loja'}
        </Text>
        <View className="w-10" />
      </View>

      {isLoadingStore ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6F35B5" />
        </View>
      ) : !store ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-sm font-bold text-neutros-cinza">Estabelecimento não encontrado.</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-6">
          {/* Card Principal */}
          <View className="bg-lojista p-6 rounded-3xl shadow-lg shadow-lojista/20 mb-5">
            <Text className="text-white text-2xl font-black">{store.tradeName}</Text>
            <Text className="text-white/80 text-xs mt-1">{store.legalName}</Text>
            <Text className="text-white/80 text-xs mt-0.5">CNPJ: {store.cnpj}</Text>

            <View className="mt-4 bg-white/15 px-3.5 py-2 rounded-2xl self-start">
              <Text className="text-white text-xs font-bold">
                {formatConversionRule(store.conversionFactor)}
              </Text>
            </View>

            <View className="mt-4 pt-3 border-t border-white/20 flex-row items-center justify-between">
              <Text className="text-white/85 text-xs">Seu saldo nesta loja</Text>
              <Text className="text-pontos text-lg font-black">{currentPoints} pts</Text>
            </View>
          </View>

          {isStoreInactive && (
            <View className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex-row items-center gap-2 mb-5">
              <Ionicons name="warning-outline" size={20} color="#D97706" />
              <Text className="text-xs text-amber-900 flex-1 font-medium">
                Este parceiro está temporariamente inativo (RN11). Novos resgates estão bloqueados no momento.
              </Text>
            </View>
          )}

          {/* Endereço e Contatos */}
          <View className="bg-white p-5 rounded-3xl border border-neutros-borda mb-5">
            <Text className="text-sm font-bold text-neutros-texto mb-3">Localização e Contato</Text>
            {store.address && (
              <TouchableOpacity
                onPress={handleOpenMaps}
                className="flex-row items-start gap-2.5 pb-3 border-b border-neutros-fundo"
              >
                <Ionicons name="location-outline" size={18} color="#6F35B5" />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-neutros-texto">
                    {store.address.street}, {store.address.number}
                  </Text>
                  <Text className="text-xs text-neutros-cinza">
                    {store.address.neighborhood} — {store.address.city}/{store.address.state}
                  </Text>
                  <Text className="text-[11px] font-bold text-lojista mt-1">Abrir no mapa</Text>
                </View>
              </TouchableOpacity>
            )}

            <View className="flex-row gap-2.5 mt-3">
              {store.phone && (
                <TouchableOpacity
                  onPress={() => handleOpenPhone(store.phone)}
                  className="flex-1 py-2.5 px-3 bg-neutros-fundo rounded-xl flex-row items-center justify-center gap-1.5"
                >
                  <Ionicons name="call-outline" size={16} color="#171717" />
                  <Text className="text-xs font-bold text-neutros-texto">Ligar</Text>
                </TouchableOpacity>
              )}
              {store.whatsapp && (
                <TouchableOpacity
                  onPress={() => handleOpenWhatsapp(store.whatsapp)}
                  className="flex-1 py-2.5 px-3 bg-consumidor/10 rounded-xl flex-row items-center justify-center gap-1.5"
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#008D4C" />
                  <Text className="text-xs font-bold text-consumidor">WhatsApp</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Ação Rápida Escanear */}
          <TouchableOpacity
            onPress={() => router.push('/(consumer)/(tabs)/scan')}
            activeOpacity={0.8}
            className="w-full py-3.5 bg-consumidor rounded-2xl items-center justify-center flex-row gap-2 mb-6"
          >
            <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">Escanear Nota Desta Loja</Text>
          </TouchableOpacity>

          {/* Vitrine de Recompensas (RN09 / Task #11) */}
          <Text className="text-lg font-extrabold text-neutros-texto mb-3">
            Recompensas Disponíveis
          </Text>

          {isLoadingRewards ? (
            <ActivityIndicator color="#6F35B5" className="my-4" />
          ) : rewards.length === 0 ? (
            <View className="bg-white p-6 rounded-2xl border border-neutros-borda items-center">
              <Text className="text-xs text-neutros-cinza text-center">
                Este estabelecimento ainda não possui cupons disponíveis para resgate.
              </Text>
            </View>
          ) : (
            <View className="gap-3 mb-8">
              {rewards.map((reward) => {
                const canAfford = currentPoints >= reward.pointsCost;
                const disabled = Boolean(isStoreInactive) || !canAfford || redeemMutation.isPending;

                return (
                  <View
                    key={reward.id}
                    className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 mr-3">
                        <Text className="text-base font-bold text-neutros-texto">
                          {reward.title}
                        </Text>
                        <Text className="text-xs font-bold text-lojista mt-0.5">
                          {formatRewardDiscount(reward)}
                        </Text>
                      </View>
                      <View className="px-3 py-1 rounded-full bg-pontos/20">
                        <Text className="text-xs font-black text-amber-900">
                          {reward.pointsCost} pts
                        </Text>
                      </View>
                    </View>

                    {reward.description ? (
                      <Text className="text-xs text-neutros-cinza mb-3">{reward.description}</Text>
                    ) : null}

                    <TouchableOpacity
                      onPress={() => handleRedeem(reward)}
                      disabled={disabled}
                      activeOpacity={0.8}
                      className={`w-full py-3 rounded-2xl items-center ${
                        disabled ? 'bg-zinc-200' : 'bg-lojista'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          disabled ? 'text-zinc-500' : 'text-white'
                        }`}
                      >
                        {isStoreInactive
                          ? 'Indisponível (Loja Inativa)'
                          : !canAfford
                            ? `Faltam ${reward.pointsCost - currentPoints} pts`
                            : 'Resgatar Cupom'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
