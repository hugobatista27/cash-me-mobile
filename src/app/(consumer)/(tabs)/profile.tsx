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
import { CustomerProfile, useAuthStore } from '@/stores/use-auth-store';

export default function ConsumerProfileScreen() {
  const router = useRouter();
  const { user, profile, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const customerProfile = profile as CustomerProfile | null;

  const handleLogout = async () => {
    Alert.alert(
      'Encerrar Sessão',
      'Tem certeza de que deseja sair da sua conta?',
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
        {/* Header Perfil */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-consumidor/10 border-2 border-consumidor items-center justify-center mb-3">
            <Ionicons name="person" size={40} color="#008D4C" />
          </View>
          <Text className="text-xl font-extrabold text-neutros-texto">
            {customerProfile?.fullName || 'Consumidor'}
          </Text>
          <Text className="text-sm text-neutros-cinza">{user?.email}</Text>
        </View>

        {/* Informações Cadastrais */}
        <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-6">
          <Text className="text-base font-bold text-neutros-texto mb-3">
            Dados da Conta
          </Text>

          <View className="py-2.5 border-b border-neutros-fundo">
            <Text className="text-xs text-neutros-cinza">Nome Completo</Text>
            <Text className="text-sm font-semibold text-neutros-texto mt-0.5">
              {customerProfile?.fullName || 'Não informado'}
            </Text>
          </View>

          <View className="py-2.5 border-b border-neutros-fundo">
            <Text className="text-xs text-neutros-cinza">E-mail</Text>
            <Text className="text-sm font-semibold text-neutros-texto mt-0.5">
              {user?.email}
            </Text>
          </View>

          {customerProfile?.cpf && (
            <View className="py-2.5 border-b border-neutros-fundo">
              <Text className="text-xs text-neutros-cinza">CPF</Text>
              <Text className="text-sm font-semibold text-neutros-texto mt-0.5">
                {customerProfile.cpf}
              </Text>
            </View>
          )}

          {customerProfile?.phone && (
            <View className="py-2.5 border-b border-neutros-fundo">
              <Text className="text-xs text-neutros-cinza">Telefone</Text>
              <Text className="text-sm font-semibold text-neutros-texto mt-0.5">
                {customerProfile.phone}
              </Text>
            </View>
          )}

          <View className="py-2.5">
            <Text className="text-xs text-neutros-cinza">Status do Usuário</Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <View className="w-2 h-2 rounded-full bg-consumidor" />
              <Text className="text-sm font-bold text-consumidor">
                {user?.status === 'ACTIVE' ? 'Ativo' : user?.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Segurança e Privacidade */}
        <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-8">
          <Text className="text-base font-bold text-neutros-texto mb-3">
            Segurança & Conformidade
          </Text>
          <View className="flex-row items-center gap-3 py-2 border-b border-neutros-fundo">
            <Ionicons name="shield-checkmark-outline" size={20} color="#008D4C" />
            <Text className="text-sm text-neutros-texto flex-1">
              Armazenamento de token criptografado (Keychain/Keystore)
            </Text>
          </View>
          <View className="flex-row items-center gap-3 py-2">
            <Ionicons name="lock-closed-outline" size={20} color="#008D4C" />
            <Text className="text-sm text-neutros-texto flex-1">
              Conformidade LGPD e proteção de dados
            </Text>
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
