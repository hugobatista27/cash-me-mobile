import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, FieldErrors, useForm } from 'react-hook-form';
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

import { extractApiErrorMessage, extractApiFieldErrors } from '@/services/api';
import { authService, RegisterEstablishmentResponse } from '@/services/auth';
import { useAuthStore } from '@/stores/use-auth-store';
import {
  cleanDigits,
  formatCEP,
  formatCNPJ,
  formatPhone,
  isValidCNPJ,
} from '@/utils/validators';

const signupMerchantSchema = z
  .object({
    // Dados do Gestor
    managerName: z
      .string()
      .trim()
      .min(1, 'Nome do gestor é obrigatório')
      .min(3, 'O nome deve ter pelo menos 3 caracteres')
      .max(255, 'O nome deve ter no máximo 255 caracteres'),
    email: z
      .string()
      .trim()
      .min(1, 'E-mail corporativo é obrigatório')
      .max(254, 'O e-mail deve ter no máximo 254 caracteres')
      .email('Formato de e-mail inválido'),
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .max(32, 'A senha deve ter no máximo 32 caracteres'),
    passwordConfirmation: z
      .string()
      .min(1, 'Confirmação de senha é obrigatória'),

    // Dados da Empresa
    cnpj: z
      .string()
      .trim()
      .min(1, 'CNPJ é obrigatório')
      .refine((val) => isValidCNPJ(val), { message: 'CNPJ inválido' }),
    legalName: z
      .string()
      .trim()
      .min(1, 'Razão Social é obrigatória')
      .min(2, 'Razão social muito curta')
      .max(255, 'Razão social deve ter no máximo 255 caracteres'),
    tradeName: z
      .string()
      .trim()
      .min(1, 'Nome Fantasia é obrigatório')
      .min(2, 'Nome fantasia muito curto')
      .max(255, 'Nome fantasia deve ter no máximo 255 caracteres'),
    phone: z
      .string()
      .trim()
      .min(1, 'Telefone de contato é obrigatório')
      .refine((val) => cleanDigits(val).length >= 10, {
        message: 'DDD + número (mínimo 10 dígitos)',
      }),

    // Endereço
    postalCode: z
      .string()
      .trim()
      .min(1, 'CEP é obrigatório')
      .refine((val) => cleanDigits(val).length === 8, {
        message: 'CEP deve ter 8 dígitos',
      }),
    street: z.string().trim().min(1, 'Logradouro é obrigatório').max(255),
    number: z.string().trim().min(1, 'Número é obrigatório').max(20),
    neighborhood: z.string().trim().min(1, 'Bairro é obrigatório').max(100),
    city: z.string().trim().min(1, 'Cidade é obrigatória').max(100),
    state: z
      .string()
      .trim()
      .min(1, 'UF é obrigatório')
      .length(2, 'UF deve ter 2 letras (ex: SC, PR)'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirmation'],
  });

type SignupMerchantFormData = z.infer<typeof signupMerchantSchema>;

const MERCHANT_FIELD_LABELS: Record<keyof SignupMerchantFormData, string> = {
  managerName: 'Nome do Gestor',
  email: 'E-mail Corporativo',
  password: 'Senha',
  passwordConfirmation: 'Confirmar Senha',
  cnpj: 'CNPJ',
  legalName: 'Razão Social',
  tradeName: 'Nome Fantasia',
  phone: 'Telefone Comercial',
  postalCode: 'CEP',
  street: 'Rua/Avenida',
  number: 'Número',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'UF',
};

const API_TO_FORM_FIELD: Record<string, keyof SignupMerchantFormData> = {
  'user.fullName': 'managerName',
  'user.email': 'email',
  'user.password': 'password',
  'user.passwordConfirmation': 'passwordConfirmation',
  'establishment.cnpj': 'cnpj',
  'establishment.legalName': 'legalName',
  'establishment.tradeName': 'tradeName',
  'establishment.contact.phone': 'phone',
  'address.postalCode': 'postalCode',
  'address.street': 'street',
  'address.number': 'number',
  'address.neighborhood': 'neighborhood',
  'address.city': 'city',
  'address.state': 'state',
};

export default function SignupMerchantScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupMerchantFormData>({
    resolver: zodResolver(signupMerchantSchema),
    defaultValues: {
      managerName: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      cnpj: '',
      legalName: '',
      tradeName: '',
      phone: '',
      postalCode: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  useEffect(() => {
    if (errorMessage) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [errorMessage]);

  const onInvalid = (formErrors: FieldErrors<SignupMerchantFormData>) => {
    const invalidLabels = (Object.keys(formErrors) as (keyof SignupMerchantFormData)[])
      .map((key) => MERCHANT_FIELD_LABELS[key])
      .filter(Boolean);
    if (invalidLabels.length > 0) {
      setErrorMessage(`Corrija os campos destacados: ${invalidLabels.join(', ')}.`);
    }
  };

  const onSubmit = async (data: SignupMerchantFormData) => {
    setErrorMessage(null);
    const normalizedEmail = data.email.trim().toLowerCase();
    let response: RegisterEstablishmentResponse;
    try {
      response = await authService.registerEstablishment({
        user: {
          fullName: data.managerName.trim(),
          email: normalizedEmail,
          password: data.password,
          passwordConfirmation: data.passwordConfirmation,
        },
        establishment: {
          cnpj: cleanDigits(data.cnpj),
          legalName: data.legalName.trim(),
          tradeName: data.tradeName.trim(),
          contact: {
            phone: cleanDigits(data.phone),
            email: normalizedEmail,
          },
        },
        address: {
          postalCode: cleanDigits(data.postalCode),
          street: data.street.trim(),
          number: data.number.trim(),
          neighborhood: data.neighborhood.trim(),
          city: data.city.trim(),
          state: data.state.trim().toUpperCase(),
        },
      });
    } catch (err: unknown) {
      const fieldErrors = extractApiFieldErrors(err);
      for (const [apiField, message] of Object.entries(fieldErrors)) {
        const mapped = API_TO_FORM_FIELD[apiField];
        if (mapped) {
          setError(mapped, { message });
        }
      }
      setErrorMessage(
        extractApiErrorMessage(err, 'Falha no cadastro do estabelecimento. Verifique os dados informados.')
      );
      return;
    }

    try {
      await setAuth({
        user: response.user,
        token: response.token,
        profile: response.profile,
        establishment: response.establishment,
      });
    } catch {
      setErrorMessage('Comércio cadastrado com sucesso, mas falhou ao salvar sessão local. Faça login.');
      return;
    }

    router.replace('/(merchant)/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerClassName="grow px-6 py-6"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View className="mb-6">
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="mb-3">
                <Text className="text-sm font-semibold text-lojista">← Voltar para login</Text>
              </TouchableOpacity>
            </Link>
            <Text className="text-2xl font-extrabold text-neutros-texto">
              Onboarding do Comércio
            </Text>
            <Text className="text-sm text-neutros-cinza mt-1">
              Cadastre seu estabelecimento e fidelize seus clientes com cashback
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
          <View className="bg-white p-6 rounded-3xl border border-neutros-borda shadow-sm gap-4">
            <Text className="text-base font-bold text-lojista mb-1">
              1. Dados do Administrador
            </Text>

            {/* Nome do Gestor */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">Nome do Gestor</Text>
              <Controller
                control={control}
                name="managerName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="Ex: Carlos Eduardo"
                    placeholderTextColor="#A3A3A3"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.managerName && (
                <Text className="text-xs text-red-600 mt-1">{errors.managerName.message}</Text>
              )}
            </View>

            {/* E-mail */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">E-mail Corporativo</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="contato@minhaloja.com"
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

            {/* Senha */}
            <View>
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
            <View>
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

            <View className="h-px bg-neutros-borda my-2" />

            <Text className="text-base font-bold text-lojista mb-1">
              2. Dados do Estabelecimento
            </Text>

            {/* CNPJ */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">CNPJ</Text>
              <Controller
                control={control}
                name="cnpj"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="00.000.000/0000-00"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="numeric"
                    maxLength={18}
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(formatCNPJ(text))}
                    value={value}
                  />
                )}
              />
              {errors.cnpj && (
                <Text className="text-xs text-red-600 mt-1">{errors.cnpj.message}</Text>
              )}
            </View>

            {/* Razão Social */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">Razão Social</Text>
              <Controller
                control={control}
                name="legalName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="Ex: Comercial de Alimentos Ltda"
                    placeholderTextColor="#A3A3A3"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.legalName && (
                <Text className="text-xs text-red-600 mt-1">{errors.legalName.message}</Text>
              )}
            </View>

            {/* Nome Fantasia */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">Nome Fantasia</Text>
              <Controller
                control={control}
                name="tradeName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="Ex: Supermercado Central"
                    placeholderTextColor="#A3A3A3"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.tradeName && (
                <Text className="text-xs text-red-600 mt-1">{errors.tradeName.message}</Text>
              )}
            </View>

            {/* Telefone */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">Telefone Comercial</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="(00) 0000-0000"
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

            <View className="h-px bg-neutros-borda my-2" />

            <Text className="text-base font-bold text-lojista mb-1">
              3. Endereço Comercial
            </Text>

            {/* CEP */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">CEP</Text>
              <Controller
                control={control}
                name="postalCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                    placeholder="00000-000"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="numeric"
                    maxLength={9}
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(formatCEP(text))}
                    value={value}
                  />
                )}
              />
              {errors.postalCode && (
                <Text className="text-xs text-red-600 mt-1">{errors.postalCode.message}</Text>
              )}
            </View>

            {/* Logradouro e Número */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-neutros-texto mb-2">Rua/Avenida</Text>
                <Controller
                  control={control}
                  name="street"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                      placeholder="Ex: Av. Brasil"
                      placeholderTextColor="#A3A3A3"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.street && (
                  <Text className="text-xs text-red-600 mt-1">{errors.street.message}</Text>
                )}
              </View>

              <View className="w-24">
                <Text className="text-sm font-semibold text-neutros-texto mb-2">Número</Text>
                <Controller
                  control={control}
                  name="number"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                      placeholder="123"
                      placeholderTextColor="#A3A3A3"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.number && (
                  <Text className="text-xs text-red-600 mt-1">{errors.number.message}</Text>
                )}
              </View>
            </View>

            {/* Bairro, Cidade e UF */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-neutros-texto mb-2">Bairro</Text>
                <Controller
                  control={control}
                  name="neighborhood"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                      placeholder="Centro"
                      placeholderTextColor="#A3A3A3"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.neighborhood && (
                  <Text className="text-xs text-red-600 mt-1">{errors.neighborhood.message}</Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-neutros-texto mb-2">Cidade</Text>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
                      placeholder="São Paulo"
                      placeholderTextColor="#A3A3A3"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.city && (
                  <Text className="text-xs text-red-600 mt-1">{errors.city.message}</Text>
                )}
              </View>

              <View className="w-16">
                <Text className="text-sm font-semibold text-neutros-texto mb-2">UF</Text>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full h-12 px-2 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base text-center"
                      placeholder="SP"
                      placeholderTextColor="#A3A3A3"
                      autoCapitalize="characters"
                      maxLength={2}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.state && (
                  <Text className="text-xs text-red-600 mt-1">{errors.state.message}</Text>
                )}
              </View>
            </View>

            {/* Inline Error Banner near Submit */}
            {errorMessage && (
              <View className="mt-2 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                <Text className="text-xs text-red-700 font-semibold text-center">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit, onInvalid)}
              disabled={isSubmitting}
              activeOpacity={0.8}
              className="w-full h-14 bg-lojista rounded-2xl items-center justify-center shadow-sm mt-2"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold">Cadastrar Comércio</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View className="mt-6 mb-8 items-center">
            <View className="flex-row items-center">
              <Text className="text-sm text-neutros-cinza">Já possui cadastro? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-bold text-lojista">Entrar</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
