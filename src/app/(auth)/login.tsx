import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { extractApiErrorMessage } from '@/services/api';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/use-auth-store';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'A senha deve ter no mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      const response = await authService.login({
        email: data.email.trim(),
        password: data.password,
      });

      if (response.user.userType !== 'ESTABLISHMENT' && response.user.userType !== 'CUSTOMER') {
        setErrorMessage('Tipo de conta não suportado no aplicativo móvel. Utilize o painel administrativo.');
        return;
      }

      await setAuth({
        user: response.user,
        token: response.token,
        profile: response.profile,
        establishment: response.establishment,
      });

      if (response.user.userType === 'ESTABLISHMENT') {
        router.replace('/(merchant)/(tabs)');
      } else {
        router.replace('/(consumer)/(tabs)');
      }
    } catch (err: unknown) {
      setErrorMessage(extractApiErrorMessage(err, 'Falha ao autenticar. Verifique seu e-mail e senha.'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-3xl bg-consumidor items-center justify-center shadow-lg shadow-consumidor/30 mb-4">
              <Text className="text-white text-3xl font-extrabold tracking-tight">CM</Text>
            </View>
            <Text className="text-3xl font-extrabold text-neutros-texto tracking-tight">
              Bem-vindo ao <Text className="text-consumidor">CashMe</Text>
            </Text>
            <Text className="text-sm font-medium text-neutros-cinza text-center mt-1">
              Acesse sua conta para gerenciar pontos e cashback
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <Text className="text-sm text-red-700 font-medium text-center">
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Form Card */}
          <View className="bg-white p-6 rounded-3xl border border-neutros-borda shadow-sm">
            {/* E-mail */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutros-texto mb-2">E-mail</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="seu.email@exemplo.com"
                    placeholderTextColor="#A3A3A3"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && (
                <Text className="text-xs text-red-600 mt-1">{errors.email.message}</Text>
              )}
            </View>

            {/* Senha */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutros-texto mb-2">Senha</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="Sua senha secreta"
                    placeholderTextColor="#A3A3A3"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.password && (
                <Text className="text-xs text-red-600 mt-1">{errors.password.message}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              activeOpacity={0.8}
              className="w-full h-13 bg-consumidor rounded-2xl items-center justify-center shadow-sm"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold">Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Links para Cadastros */}
          <View className="mt-8 items-center gap-3">
            <View className="flex-row items-center">
              <Text className="text-sm text-neutros-cinza">Novo por aqui? </Text>
              <Link href="/(auth)/signup-consumer" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-bold text-consumidor">
                    Criar conta Consumidor
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View className="flex-row items-center">
              <Text className="text-sm text-neutros-cinza">Possui um negócio? </Text>
              <Link href="/(auth)/signup-merchant" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-bold text-lojista">
                    Cadastrar Lojista
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
