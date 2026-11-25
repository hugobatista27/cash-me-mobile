import { Ionicons } from '@expo/vector-icons';
import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/use-auth-store';

export default function MerchantLayout() {
  const { isAuthenticated, user, establishment, isRestoringSession } = useAuthStore();

  if (isRestoringSession) {
    return (
      <View className="flex-1 bg-neutros-fundo items-center justify-center">
        <ActivityIndicator size="large" color="#6F35B5" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.userType === 'CUSTOMER') {
    return <Redirect href="/(consumer)/(tabs)" />;
  }

  if (user?.userType !== 'ESTABLISHMENT') {
    return <Redirect href="/(auth)/login" />;
  }

  const isPending = establishment?.status === 'PENDING';
  const isInactive = establishment?.status === 'INACTIVE';

  return (
    <View className="flex-1 bg-neutros-fundo">
      {/* Banner de Homologação Pendente (RN06) */}
      {isPending && (
        <SafeAreaView edges={['top']} className="bg-amber-500">
          <View className="px-4 py-2.5 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
            <View className="flex-1">
              <Text className="text-white text-xs font-bold">
                Estabelecimento em Homologação (RN06)
              </Text>
              <Text className="text-white/90 text-xs leading-tight">
                Seu cadastro está em análise pela equipe administrativa antes da liberação total das regras.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* Banner de Estabelecimento Inativo/Inadimplente (RN05/RN11) */}
      {isInactive && (
        <SafeAreaView edges={['top']} className="bg-red-600">
          <View className="px-4 py-2.5 flex-row items-center gap-2">
            <Ionicons name="warning" size={20} color="#FFFFFF" />
            <View className="flex-1">
              <Text className="text-white text-xs font-bold">
                Estabelecimento Inativo / Suspenso (RN05/RN11)
              </Text>
              <Text className="text-white/90 text-xs leading-tight">
                O cômputo de novas notas e novos resgates de cupons estão temporariamente bloqueados.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      )}

      <Slot />
    </View>
  );
}
