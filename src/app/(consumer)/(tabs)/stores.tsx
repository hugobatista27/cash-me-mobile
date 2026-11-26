import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import { useStores } from '@/hooks/useStores';
import { formatConversionRule, StoreItem } from '@/services/stores';

export default function ConsumerStoresScreen() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: stores = [], isLoading, isError, isRefetching, refetch } = useStores();

  const activeStores = stores
    .filter((store) => store.status === 'ACTIVE')
    .filter((store) => {
      if (!debouncedSearch) return true;
      return (
        store.tradeName.toLowerCase().includes(debouncedSearch) ||
        store.legalName.toLowerCase().includes(debouncedSearch) ||
        store.address?.city?.toLowerCase().includes(debouncedSearch) ||
        store.address?.neighborhood?.toLowerCase().includes(debouncedSearch)
      );
    });

  const renderStoreCard = ({ item }: { item: StoreItem }) => {
    const locationText = item.address
      ? `${item.address.neighborhood}, ${item.address.city} - ${item.address.state}`
      : 'Endereço não informado';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(consumer)/store/${item.id}` as never)}
        activeOpacity={0.8}
        className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-3"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-base font-extrabold text-neutros-texto" numberOfLines={1}>
              {item.tradeName}
            </Text>
            <Text className="text-xs text-neutros-cinza mt-0.5" numberOfLines={1}>
              {locationText}
            </Text>
          </View>
          <View className="w-10 h-10 rounded-xl bg-lojista/10 items-center justify-center">
            <Ionicons name="storefront" size={20} color="#6F35B5" />
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-neutros-fundo">
          <View className="px-3 py-1 rounded-full bg-consumidor/10">
            <Text className="text-[11px] font-bold text-consumidor">
              {formatConversionRule(item.conversionFactor)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-semibold text-lojista">Ver ofertas</Text>
            <Ionicons name="chevron-forward" size={14} color="#6F35B5" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <View className="px-6 pt-4 pb-3">
        <Text className="text-xs font-bold text-lojista uppercase tracking-wider">
          Rede Parceira (RN06)
        </Text>
        <Text className="text-2xl font-extrabold text-neutros-texto mb-4">
          Lojas Credenciadas
        </Text>

        <View className="flex-row items-center bg-white border border-neutros-borda rounded-2xl px-4 h-12">
          <Ionicons name="search-outline" size={18} color="#60646C" />
          <TextInput
            className="flex-1 ml-2.5 text-sm text-neutros-texto"
            placeholder="Buscar por nome, bairro ou cidade..."
            placeholderTextColor="#A3A3A3"
            value={searchInput}
            onChangeText={setSearchInput}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => setSearchInput('')}>
              <Ionicons name="close-circle" size={18} color="#A3A3A3" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6F35B5" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-sm font-semibold text-red-600 text-center">
            Não foi possível carregar as lojas parceiras.
          </Text>
          <TouchableOpacity onPress={() => refetch()} className="mt-4 px-5 py-2.5 bg-lojista rounded-xl">
            <Text className="text-white text-xs font-bold">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activeStores}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderStoreCard}
          contentContainerClassName="px-6 pb-8"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6F35B5" />
          }
          ListEmptyComponent={
            <View className="bg-white p-8 rounded-3xl border border-neutros-borda items-center mt-4">
              <Ionicons name="storefront-outline" size={32} color="#6F35B5" />
              <Text className="text-sm font-bold text-neutros-texto mt-3 text-center">
                Nenhuma loja encontrada
              </Text>
              <Text className="text-xs text-neutros-cinza text-center mt-1">
                Tente buscar por outro termo ou atualize a lista.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
