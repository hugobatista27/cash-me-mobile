import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
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

import { RewardRedeemCard } from '@/components/consumer/reward-redeem-card';
import {
  useCustomerEstablishmentRewards,
  useRedeemRewardMutation,
} from '@/hooks/useCoupons';
import { useEstablishmentDetails } from '@/hooks/useEstablishments';
import { useCustomerBalances } from '@/hooks/useWallet';
import {
  formatCnpj,
  formatFullAddress,
  formatPhone,
  formatRuleBadge,
  formatRuleDescription,
} from '@/services/establishments';
import { Reward } from '@/services/rewards.service';

export default function ConsumerStoreDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const storeId = params.id;

  const { data: store, isLoading, isError, error, refetch } = useEstablishmentDetails(storeId);
  const {
    data: rewards = [],
    isLoading: isLoadingRewards,
  } = useCustomerEstablishmentRewards(storeId || '');

  const { data: balances = [] } = useCustomerBalances();
  const redeemMutation = useRedeemRewardMutation();
  const [redeemingId, setRedeemingId] = useState<number | string | null>(null);

  // Busca o saldo isolado do consumidor nesta loja específica (ADR-002)
  const storeBalanceItem = (balances || []).find(
    (b) =>
      String(b.establishment?.id) === String(storeId) ||
      String(b.establishmentId) === String(storeId)
  );
  const currentStoreBalance = storeBalanceItem?.currentBalance ?? 0;
  const isStoreInactive = store?.status === 'INACTIVE' || store?.status === 'SUSPENDED';

  // Ação: Resgate atômico de recompensa (ADR-003, RN11)
  const handleRedeemReward = (reward: Reward) => {
    if (isStoreInactive) {
      Alert.alert(
        'Resgates Indisponíveis',
        'Este estabelecimento está temporariamente inativo para resgates de cupons (RN11). Seus pontos acumulados continuam salvos e protegidos.'
      );
      return;
    }

    if (currentStoreBalance < reward.pointsCost) {
      Alert.alert(
        'Saldo Insuficiente',
        `Você possui ${currentStoreBalance} pts nesta loja, mas este cupom requer ${reward.pointsCost} pts.`
      );
      return;
    }

    Alert.alert(
      'Confirmar Resgate de Cupom',
      `Deseja resgatar "${reward.title}" por ${reward.pointsCost} pontos?\n\nOs pontos serão debitados atômica e imediatamente da sua carteira nesta loja (ADR-003).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Resgate',
          style: 'default',
          onPress: async () => {
            setRedeemingId(reward.id);
            try {
              const res = await redeemMutation.mutateAsync(reward.id);
              const couponCode = res.coupon?.code || '';
              Alert.alert(
                'Cupom Resgatado com Sucesso! 🎉',
                `Seu código de desconto é ${couponCode}. Ele já está disponível na aba "Meus Cupons" da sua carteira para uso no caixa.`,
                [
                  { text: 'Continuar na Loja', style: 'cancel' },
                  {
                    text: 'Ver Meus Cupons',
                    onPress: () => router.push('/(consumer)/coupons'),
                  },
                ]
              );
            } catch (err: unknown) {
              const maybeAxios = err as { response?: { data?: { message?: string } } };
              const msg =
                maybeAxios?.response?.data?.message ||
                'Não foi possível concluir o resgate do cupom. Tente novamente.';
              Alert.alert('Falha no Resgate', msg);
            } finally {
              setRedeemingId(null);
            }
          },
        },
      ]
    );
  };

  // Ação: Abrir aplicativo de mapas com endereço
  const handleOpenMaps = async () => {
    if (!store?.address) {
      Alert.alert('Endereço', 'Endereço não disponível para este estabelecimento.');
      return;
    }

    const { latitude, longitude, street, number, city, state } = store.address;
    let mapUrl = '';

    if (latitude && longitude) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    } else {
      const fullQuery = encodeURIComponent(
        `${street || ''}, ${number || ''}, ${city || ''} - ${state || ''}`
      );
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${fullQuery}`;
    }

    try {
      await Linking.openURL(mapUrl);
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o aplicativo de mapas.');
    }
  };

  // Ação: Ligar para o telefone da loja
  const handleCallPhone = async (phone: string) => {
    const cleanNumber = phone.replace(/\D/g, '');
    const telUrl = `tel:${cleanNumber}`;
    try {
      await Linking.openURL(telUrl);
    } catch {
      Alert.alert('Erro', 'Não foi possível iniciar a chamada.');
    }
  };

  // Ação: Abrir conversa no WhatsApp
  const handleOpenWhatsapp = async (whatsapp: string) => {
    const cleanNumber = whatsapp.replace(/\D/g, '');
    // Se o número não contiver DDI 55, adiciona
    const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    const whatsappUrl = `https://wa.me/${fullNumber}`;
    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    }
  };

  // Ação: Redirecionar para scanner de cupom
  const handleScanReceipt = () => {
    router.push('/(consumer)/(tabs)/scan');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutros-fundo items-center justify-center p-6">
        <ActivityIndicator size="large" color="#008D4C" />
        <Text className="text-xs text-neutros-cinza font-semibold mt-3">
          Carregando informações da loja...
        </Text>
      </SafeAreaView>
    );
  }

  if (isError || !store) {
    return (
      <SafeAreaView className="flex-1 bg-neutros-fundo items-center justify-center p-8">
        <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
          <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
        </View>
        <Text className="text-base font-bold text-neutros-texto text-center">
          Loja não encontrada
        </Text>
        <Text className="text-xs text-neutros-cinza text-center mt-1 mb-5">
          {error?.message || 'Não conseguimos obter as informações deste estabelecimento.'}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          activeOpacity={0.8}
          className="px-6 py-3 bg-consumidor rounded-xl mb-3"
        >
          <Text className="text-white font-bold text-sm">Tentar Novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="px-6 py-2"
        >
          <Text className="text-neutros-cinza font-semibold text-sm">Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const badgeText = formatRuleBadge(store.conversionFactor);
  const ruleDesc = formatRuleDescription(store.conversionFactor);
  const addressFormatted = formatFullAddress(store.address);

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo" edges={['top']}>
      {/* Barra Superior / Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-neutros-borda/60 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={20} color="#171717" />
        </TouchableOpacity>

        <Text
          numberOfLines={1}
          className="text-base font-extrabold text-neutros-texto flex-1 text-center px-3"
        >
          {store.tradeName}
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView contentContainerClassName="p-5 pb-16 gap-4" showsVerticalScrollIndicator={false}>
        {/* Banner Principal com Identificação da Loja */}
        <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-16 h-16 rounded-2xl bg-consumidor/10 items-center justify-center border border-consumidor/20">
              <Ionicons name="storefront" size={32} color="#008D4C" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-black text-neutros-texto tracking-tight">
                {store.tradeName}
              </Text>
              <Text className="text-xs text-neutros-cinza mt-0.5" numberOfLines={1}>
                {store.legalName}
              </Text>
              {store.cnpj && (
                <Text className="text-[11px] font-mono text-neutros-cinza mt-0.5">
                  CNPJ: {formatCnpj(store.cnpj)}
                </Text>
              )}
            </View>
          </View>

          {/* Status da Loja */}
          <View className="flex-row items-center justify-between pt-3 border-t border-neutros-borda/60">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-consumidor" />
              <Text className="text-xs font-bold text-consumidor">
                Parceiro Oficial Credenciado
              </Text>
            </View>
            <View className="bg-consumidor/10 px-3 py-1 rounded-full border border-consumidor/20">
              <Text className="text-xs font-bold text-consumidor">{badgeText}</Text>
            </View>
          </View>
        </View>

        {/* Card de Regra de Fidelidade Ativa (RN04) */}
        <View className="bg-consumidor p-5 rounded-3xl shadow-lg shadow-consumidor/30">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="gift-outline" size={16} color="#FFFFFF" />
            </View>
            <Text className="text-xs font-bold text-white/90 uppercase tracking-wider">
              Regra de Pontuação Vigente
            </Text>
          </View>

          <Text className="text-white text-2xl font-black tracking-tight mb-1">
            {badgeText}
          </Text>

          <Text className="text-white/95 text-sm leading-relaxed">
            {ruleDesc}
          </Text>

          <View className="mt-3 bg-white/15 px-3 py-2 rounded-xl flex-row items-center gap-2">
            <Ionicons name="sparkles" size={15} color="#F5B800" />
            <Text className="text-white text-[11px] font-semibold flex-1">
              Basta escanear o QR Code da NFC-e emitida nesta loja para pontuar!
            </Text>
          </View>
        </View>

        {/* RN11: Bloqueio de Resgates em Lojas Inativas */}
        {isStoreInactive && (
          <View className="bg-amber-50 p-4 rounded-3xl border border-amber-200 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-amber-500/15 items-center justify-center">
              <Ionicons name="alert-circle" size={22} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-amber-900">
                Resgates Temporariamente Bloqueados (RN11)
              </Text>
              <Text className="text-[11px] text-amber-700 leading-tight mt-0.5">
                Este estabelecimento está inativo para novos resgates de cupons. Seus pontos acumulados continuam 100% protegidos.
              </Text>
            </View>
          </View>
        )}

        {/* Seção: Recompensas e Cupons Disponíveis (TASK-11) */}
        <View className="gap-3 mt-1">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-bold text-neutros-texto uppercase tracking-wider">
                Recompensas & Cupons
              </Text>
              <Text className="text-xs text-neutros-cinza mt-0.5">
                Seu saldo nesta loja: <Text className="font-black text-consumidor">{currentStoreBalance} pts</Text>
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(consumer)/coupons')}
              activeOpacity={0.7}
              className="px-3 py-1.5 rounded-xl bg-consumidor/10 border border-consumidor/20 flex-row items-center gap-1"
            >
              <Ionicons name="ticket-outline" size={14} color="#008D4C" />
              <Text className="text-xs font-bold text-consumidor">Meus Cupons</Text>
            </TouchableOpacity>
          </View>

          {isLoadingRewards ? (
            <View className="py-6 items-center justify-center bg-white rounded-3xl border border-neutros-borda">
              <ActivityIndicator size="small" color="#008D4C" />
              <Text className="text-xs text-neutros-cinza font-semibold mt-2">
                Carregando cupons da loja...
              </Text>
            </View>
          ) : rewards.length === 0 ? (
            <View className="py-6 items-center justify-center bg-white rounded-3xl border border-neutros-borda px-6">
              <Ionicons name="gift-outline" size={28} color="#A3A3A3" />
              <Text className="text-sm font-bold text-neutros-texto mt-2 text-center">
                Nenhum cupom ativo no momento
              </Text>
              <Text className="text-xs text-neutros-cinza text-center mt-1">
                Esta loja ainda não disponibilizou cupons para troca por pontos.
              </Text>
            </View>
          ) : (
            rewards.map((reward) => (
              <RewardRedeemCard
                key={reward.id}
                reward={reward}
                onRedeem={handleRedeemReward}
                isRedeeming={redeemingId === reward.id}
                isStoreInactive={isStoreInactive}
                userBalance={currentStoreBalance}
              />
            ))
          )}
        </View>

        {/* Card de Endereço e Localização */}
        <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="location" size={18} color="#008D4C" />
              <Text className="text-sm font-bold text-neutros-texto uppercase tracking-wider">
                Endereço
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleOpenMaps}
              activeOpacity={0.7}
              className="px-3 py-1.5 rounded-lg bg-consumidor/10 border border-consumidor/20 flex-row items-center gap-1"
            >
              <Ionicons name="navigate-outline" size={13} color="#008D4C" />
              <Text className="text-xs font-bold text-consumidor">Abrir no Mapa</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-neutros-texto leading-relaxed">
            {addressFormatted}
          </Text>

          {store.address?.reference && (
            <View className="bg-neutros-fundo p-2.5 rounded-xl border border-neutros-borda/60">
              <Text className="text-xs text-neutros-cinza">
                Ponto de referência: {store.address.reference}
              </Text>
            </View>
          )}
        </View>

        {/* Card de Canais de Contato */}
        {(store.phone || store.whatsapp || store.instagram) && (
          <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm gap-3">
            <Text className="text-sm font-bold text-neutros-texto uppercase tracking-wider">
              Canais de Contato
            </Text>

            <View className="gap-2.5">
              {Boolean(store.whatsapp) && (
                <TouchableOpacity
                  onPress={() => handleOpenWhatsapp(store.whatsapp!)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-full bg-emerald-600 items-center justify-center">
                      <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-emerald-950">WhatsApp</Text>
                      <Text className="text-xs text-emerald-700">
                        {formatPhone(store.whatsapp)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="open-outline" size={16} color="#059669" />
                </TouchableOpacity>
              )}

              {Boolean(store.phone) && (
                <TouchableOpacity
                  onPress={() => handleCallPhone(store.phone!)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between p-3.5 bg-neutros-fundo rounded-2xl border border-neutros-borda"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-full bg-neutros-texto items-center justify-center">
                      <Ionicons name="call" size={16} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-neutros-texto">Telefone</Text>
                      <Text className="text-xs text-neutros-cinza">
                        {formatPhone(store.phone)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="open-outline" size={16} color="#60646C" />
                </TouchableOpacity>
              )}

              {Boolean(store.instagram) && (
                <TouchableOpacity
                  onPress={() => {
                    const handle = store.instagram!.replace(/^@/, '');
                    Linking.openURL(`https://instagram.com/${handle}`).catch(() => {
                      Alert.alert('Erro', 'Não foi possível abrir o Instagram.');
                    });
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between p-3.5 bg-pink-50 rounded-2xl border border-pink-200"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-full bg-pink-600 items-center justify-center">
                      <Ionicons name="logo-instagram" size={18} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-pink-950">Instagram</Text>
                      <Text className="text-xs text-pink-700">
                        @{store.instagram!.replace(/^@/, '')}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="open-outline" size={16} color="#DB2777" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Botão de Destaque: Escanear Nota Desta Loja */}
        <TouchableOpacity
          onPress={handleScanReceipt}
          activeOpacity={0.8}
          className="w-full h-14 bg-consumidor rounded-2xl items-center justify-center shadow-md shadow-consumidor/20 flex-row gap-2 mt-2"
        >
          <Ionicons name="qr-code" size={20} color="#FFFFFF" />
          <Text className="text-white font-extrabold text-base">
            Escanear Nota Desta Loja
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
