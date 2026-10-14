import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEstablishments } from '@/hooks/useEstablishments';
import { Establishment, formatRuleBadge } from '@/services/establishments';

export default function ConsumerStoresScreen() {
  const router = useRouter();
  const { data: establishments, isLoading, isError, error, refetch, isRefetching } = useEstablishments();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce de 300ms para o campo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtra por nome fantasia, razão social, cidade ou bairro
  const filteredStores = useMemo(() => {
    if (!establishments) return [];
    if (!debouncedSearch) return establishments;

    return establishments.filter((store) => {
      const tradeName = store.tradeName?.toLowerCase() || '';
      const legalName = store.legalName?.toLowerCase() || '';
      const city = store.address?.city?.toLowerCase() || '';
      const neighborhood = store.address?.neighborhood?.toLowerCase() || '';

      return (
        tradeName.includes(debouncedSearch) ||
        legalName.includes(debouncedSearch) ||
        city.includes(debouncedSearch) ||
        neighborhood.includes(debouncedSearch)
      );
    });
  }, [establishments, debouncedSearch]);

  const renderStoreItem = ({ item }: { item: Establishment }) => {
    const badgeText = formatRuleBadge(item.conversionFactor);
    const locationText = [item.address?.neighborhood, item.address?.city]
      .filter(Boolean)
      .join(', ') || 'Localização não informada';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(consumer)/store/${item.id}`)}
        activeOpacity={0.7}
        className="bg-white p-4 rounded-2xl border border-neutros-borda shadow-sm mb-3 flex-row items-center gap-3.5"
      >
        <View className="w-12 h-12 rounded-xl bg-consumidor/10 items-center justify-center">
          <Ionicons name="storefront" size={24} color="#008D4C" />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text
              numberOfLines={1}
              className="text-base font-extrabold text-neutros-texto flex-1"
            >
              {item.tradeName}
            </Text>
            {/* Badge da Regra de Pontuação (RN04) */}
            <View className="bg-consumidor/10 px-2.5 py-1 rounded-full border border-consumidor/20">
              <Text className="text-[11px] font-bold text-consumidor">
                {badgeText}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1 mt-1">
            <Ionicons name="location-outline" size={13} color="#60646C" />
            <Text
              numberOfLines={1}
              className="text-xs text-neutros-cinza flex-1"
            >
              {locationText}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo" edges={['top']}>
      {/* Cabeçalho */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-xs font-bold text-consumidor uppercase tracking-wider">
          Rede Parceira
        </Text>
        <Text className="text-2xl font-black text-neutros-texto tracking-tight mt-0.5">
          Lojas Credenciadas
        </Text>
        <Text className="text-xs text-neutros-cinza mt-1">
          Compre nos estabelecimentos parceiros e ganhe pontos no cupom fiscal.
        </Text>

        {/* Barra de Busca com Debounce */}
        <View className="flex-row items-center bg-white border border-neutros-borda rounded-2xl px-3.5 py-2.5 mt-4 shadow-sm">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-neutros-texto py-0"
            placeholder="Buscar por loja, cidade ou bairro..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conteúdo Principal */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#008D4C" />
          <Text className="text-xs text-neutros-cinza font-semibold mt-3">
            Carregando estabelecimentos parceiros...
          </Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
          </View>
          <Text className="text-base font-bold text-neutros-texto text-center">
            Não foi possível carregar as lojas
          </Text>
          <Text className="text-xs text-neutros-cinza text-center mt-1 mb-5">
            {error?.message || 'Verifique sua conexão e tente novamente.'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.8}
            className="px-6 py-3 bg-consumidor rounded-xl"
          >
            <Text className="text-white font-bold text-sm">Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredStores}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderStoreItem}
          contentContainerClassName="px-5 pb-8 pt-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#008D4C']}
              tintColor="#008D4C"
            />
          }
          ListEmptyComponent={
            <View className="py-16 items-center justify-center px-4">
              <View className="w-16 h-16 rounded-2xl bg-zinc-100 items-center justify-center mb-3">
                <Ionicons name="search-outline" size={30} color="#9CA3AF" />
              </View>
              <Text className="text-sm font-bold text-neutros-texto text-center">
                Nenhuma loja encontrada
              </Text>
              <Text className="text-xs text-neutros-cinza text-center mt-1 max-w-xs">
                {searchTerm
                  ? `Nenhum resultado para "${searchTerm}". Tente buscar por outra cidade ou nome.`
                  : 'Nenhum estabelecimento parceiro ativo no momento.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
