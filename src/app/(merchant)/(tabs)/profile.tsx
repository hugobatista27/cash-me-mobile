import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/services/auth';
import { EstablishmentProfile, useAuthStore } from '@/stores/use-auth-store';

export default function MerchantProfileScreen() {
  const router = useRouter();
  const { user, profile, establishment, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const establishmentProfile = profile as EstablishmentProfile | null;

  const handleLogout = async () => {
    Alert.alert(
      'Encerrar Sessão',
      'Tem certeza de que deseja sair do painel do estabelecimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await authService.logout();
            } catch {
              // Mesmo se a chamada de rede falhar, limpa a sessão local
            } finally {
              await clearAuth();
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <ScrollView contentContainerClassName="p-6">
        {/* Header Perfil Loja */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-3xl bg-lojista/10 border-2 border-lojista items-center justify-center mb-3">
            <Ionicons name="business" size={40} color="#6F35B5" />
          </View>
          <Text className="text-xl font-extrabold text-neutros-texto text-center">
            {establishment?.tradeName || 'Estabelecimento'}
          </Text>
          <Text className="text-sm text-neutros-cinza">CNPJ: {establishment?.cnpj}</Text>
        </View>

        {/* Informações Empresariais */}
        <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-6">
          <Text className="text-base font-bold text-neutros-texto mb-3">
            Dados da Empresa
          </Text>

          <View className="py-2.5 border-b border-neutros-fundo">
            <Text className="text-xs text-neutros-cinza">Nome Fantasia</Text>
            <Text className="text-sm font-semibold text-neutros-texto mt-0.5">
              {establishment?.tradeName || 'Não informado'}
            </Text>
          </View>

          {establishment?.legalName && (
            <View className="py-2.5 border-b border-neutros-fundo">
              <Text className="text-xs text-neutros-cinza">Razão Social</Text>
              <Text className="text-sm font-semibold text-neutros-texto mt-0.5">
                {establishment.legalName}
              </Text>
            </View>
          )}

          <View className="py-2.5 border-b border-neutros-fundo">
            <Text className="text-xs text-neutros-cinza">CNPJ</Text>
            <Text className="text-sm font-semibold text-neutros-texto mt-0.5">
              {establishment?.cnpj}
            </Text>
          </View>

          <View className="py-2.5 border-b border-neutros-fundo">
            <Text className="text-xs text-neutros-cinza">Gestor Responsável</Text>
            <Text className="text-sm font-semibold text-neutros-texto mt-0.5">
              {establishmentProfile?.fullName || 'Não informado'} ({user?.email})
            </Text>
          </View>

          <View className="py-2.5">
            <Text className="text-xs text-neutros-cinza">Situação Cadastral</Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <View
                className={`w-2 h-2 rounded-full ${
                  establishment?.status === 'PENDING'
                    ? 'bg-amber-500'
                    : establishment?.status === 'INACTIVE'
                      ? 'bg-red-500'
                      : 'bg-green-500'
                }`}
              />
              <Text
                className={`text-sm font-bold ${
                  establishment?.status === 'PENDING'
                    ? 'text-amber-600'
                    : establishment?.status === 'INACTIVE'
                      ? 'text-red-600'
                      : 'text-green-600'
                }`}
              >
                {establishment?.status === 'PENDING'
                  ? 'Pendente de Homologação'
                  : establishment?.status === 'INACTIVE'
                    ? 'Inativo / Suspenso'
                    : 'Ativo'}
              </Text>
            </View>
          </View>
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
          className="w-full h-13 bg-red-50 border border-red-200 rounded-2xl items-center justify-center flex-row gap-2"
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text className="text-red-600 text-base font-bold">Encerrar Sessão</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
