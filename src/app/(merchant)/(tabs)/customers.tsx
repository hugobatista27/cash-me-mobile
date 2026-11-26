import { Ionicons } from '@expo/vector-icons';
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

import { useMerchantCustomers } from '@/hooks/useMerchantCustomers';
import { MerchantCustomerItem } from '@/services/merchantCustomers';

export default function MerchantCustomersScreen() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data: customers = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useMerchantCustomers(debouncedSearch);

  const renderCustomer = ({ item }: { item: MerchantCustomerItem }) => (
    <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-base font-extrabold text-neutros-texto">{item.fullName}</Text>
          {item.email && <Text className="text-xs text-neutros-cinza mt-0.5">{item.email}</Text>}
          {item.phone && <Text className="text-xs text-neutros-cinza mt-0.5">{item.phone}</Text>}
        </View>
        <View className="items-end">
          <Text className="text-lg font-black text-lojista">{item.currentBalance} pts</Text>
          <Text className="text-[11px] text-neutros-cinza">
            Acumulado: {item.totalAccumulated} pts
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <View className="px-6 pt-4 pb-3">
        <Text className="text-xs font-bold text-lojista uppercase tracking-wider">
          Privacidade Preservada (RN08)
        </Text>
        <Text className="text-2xl font-extrabold text-neutros-texto mb-3">
          Clientes Fidelizados ({customers.length})
        </Text>

        <View className="flex-row items-center bg-white border border-neutros-borda rounded-2xl px-4 h-12 mb-3">
          <Ionicons name="search-outline" size={18} color="#60646C" />
          <TextInput
            className="flex-1 ml-2.5 text-sm text-neutros-texto"
            placeholder="Buscar cliente por nome ou e-mail..."
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
            Não foi possível carregar os clientes do estabelecimento.
          </Text>
          <TouchableOpacity onPress={() => refetch()} className="mt-4 px-5 py-2.5 bg-lojista rounded-xl">
            <Text className="text-white text-xs font-bold">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCustomer}
          contentContainerClassName="px-6 pb-8"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6F35B5" />
          }
          ListEmptyComponent={
            <View className="bg-white p-8 rounded-3xl border border-neutros-borda items-center mt-4">
              <Ionicons name="people-outline" size={32} color="#6F35B5" />
              <Text className="text-sm font-bold text-neutros-texto mt-3 text-center">
                Nenhum cliente fidelizado ainda
              </Text>
              <Text className="text-xs text-neutros-cinza text-center mt-1 leading-relaxed">
                Por privacidade (RN08), apenas consumidores que já pontuaram em seu estabelecimento aparecem aqui.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
