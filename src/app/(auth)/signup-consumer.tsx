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

import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/use-auth-store';
import { cleanDigits, formatCPF, formatPhone, isValidCPF } from '@/utils/validators';

const signupConsumerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Nome completo é obrigatório')
      .min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: z
      .string()
      .min(1, 'E-mail é obrigatório')
      .email('Formato de e-mail inválido'),
    cpf: z
      .string()
      .min(1, 'CPF é obrigatório')
      .refine((val) => isValidCPF(val), { message: 'CPF inválido' }),
    phone: z
      .string()
      .min(1, 'Telefone é obrigatório')
      .refine((val) => cleanDigits(val).length >= 10, {
        message: 'Telefone deve ter DDD + número (mínimo 10 dígitos)',
      }),
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(8, 'A senha deve ter no mínimo 8 caracteres'),
    passwordConfirmation: z
      .string()
      .min(1, 'Confirmação de senha é obrigatória'),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, {
        message: 'Você deve aceitar os Termos de Uso e Política de Privacidade',
      }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirmation'],
  });

type SignupConsumerFormData = z.infer<typeof signupConsumerSchema>;

export default function SignupConsumerScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupConsumerFormData>({
    resolver: zodResolver(signupConsumerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      cpf: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: SignupConsumerFormData) => {
    setErrorMessage(null);
    try {
      const response = await authService.signupCustomer({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
        cpf: cleanDigits(data.cpf),
        phone: cleanDigits(data.phone),
        termsAccepted: data.termsAccepted,
      });

      await setAuth({
        user: response.user,
        token: response.token,
        profile: response.profile,
      });

      router.replace('/(consumer)/(tabs)');
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg =
        maybeAxios?.response?.data?.message ||
        'Falha no cadastro. Verifique os dados informados.';
      setErrorMessage(msg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="grow px-6 py-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-6">
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="mb-3">
                <Text className="text-sm font-semibold text-consumidor">← Voltar para login</Text>
              </TouchableOpacity>
            </Link>
            <Text className="text-2xl font-extrabold text-neutros-texto">
              Criar Conta Consumidor
            </Text>
            <Text className="text-sm text-neutros-cinza mt-1">
              Acumule pontos em todas as suas compras com NFC-e
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
            {/* Nome Completo */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutros-texto mb-2">Nome Completo</Text>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="Ex: Maria Silva"
                    placeholderTextColor="#A3A3A3"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.fullName && (
                <Text className="text-xs text-red-600 mt-1">{errors.fullName.message}</Text>
              )}
            </View>

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

            {/* CPF */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutros-texto mb-2">CPF</Text>
              <Controller
                control={control}
                name="cpf"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="000.000.000-00"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="numeric"
                    maxLength={14}
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(formatCPF(text))}
                    value={value}
                  />
                )}
              />
              {errors.cpf && (
                <Text className="text-xs text-red-600 mt-1">{errors.cpf.message}</Text>
              )}
            </View>

            {/* Telefone */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutros-texto mb-2">Telefone Celular</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="(00) 00000-0000"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="phone-pad"
                    maxLength={15}
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(formatPhone(text))}
                    value={value}
                  />
                )}
              />
              {errors.phone && (
                <Text className="text-xs text-red-600 mt-1">{errors.phone.message}</Text>
              )}
            </View>

            {/* Senha */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-neutros-texto mb-2">Senha</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="Mínimo 8 caracteres"
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

            {/* Confirmação de Senha */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-neutros-texto mb-2">Confirmar Senha</Text>
              <Controller
                control={control}
                name="passwordConfirmation"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="Repita sua senha"
                    placeholderTextColor="#A3A3A3"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.passwordConfirmation && (
                <Text className="text-xs text-red-600 mt-1">
                  {errors.passwordConfirmation.message}
                </Text>
              )}
            </View>

            {/* Termos de Uso Checkbox */}
            <View className="mb-6">
              <Controller
                control={control}
                name="termsAccepted"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    className="flex-row items-center gap-3"
                    activeOpacity={0.8}
                    onPress={() => onChange(!value)}
                  >
                    <View
                      className={`w-6 h-6 rounded-lg border items-center justify-center ${
                        value
                          ? 'bg-consumidor border-consumidor'
                          : 'border-neutros-borda bg-neutros-fundo'
                      }`}
                    >
                      {value && <Text className="text-white text-xs font-bold">✓</Text>}
                    </View>
                    <Text className="text-xs text-neutros-cinza flex-1 leading-relaxed">
                      Declaro que li e aceito os{' '}
                      <Text className="font-bold text-consumidor">Termos de Uso</Text> e a{' '}
                      <Text className="font-bold text-consumidor">Política de Privacidade</Text>.
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {errors.termsAccepted && (
                <Text className="text-xs text-red-600 mt-2">
                  {errors.termsAccepted.message}
                </Text>
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
                <Text className="text-white text-base font-bold">Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View className="mt-6 mb-8 items-center">
            <View className="flex-row items-center">
              <Text className="text-sm text-neutros-cinza">Já possui cadastro? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-bold text-consumidor">Entrar</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
