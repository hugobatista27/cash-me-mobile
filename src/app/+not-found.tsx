import { Link, Stack } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Não Encontrado', headerShown: false }} />
      <SafeAreaView className="flex-1 bg-neutros-fundo items-center justify-center p-6">
        <View className="items-center max-w-sm w-full bg-white p-8 rounded-3xl border border-neutros-borda shadow-sm">
          <View className="w-16 h-16 rounded-2xl bg-consumidor/10 items-center justify-center mb-4">
            <Text className="text-consumidor text-2xl font-bold">404</Text>
          </View>

          <Text className="text-xl font-bold text-neutros-texto text-center mb-2">
            Página Não Encontrada
          </Text>

          <Text className="text-sm text-neutros-cinza text-center mb-6">
            A tela que você está tentando acessar não existe ou foi movida.
          </Text>

          <Link href="/" asChild>
            <View className="w-full bg-consumidor py-3.5 px-6 rounded-2xl items-center active:opacity-90">
              <Text className="text-white font-semibold text-base">
                Voltar ao Início
              </Text>
            </View>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
