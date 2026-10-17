import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateRewardMutation } from '@/hooks/useRewards';
import {
  CreateRewardDTO,
  RewardDiscountType,
} from '@/services/rewards.service';

interface FormErrors {
  title?: string;
  discountValue?: string;
  pointsCost?: string;
  stock?: string;
  validityDays?: string;
}

export default function CreateMerchantRewardScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<RewardDiscountType>('FIXED_AMOUNT');
  const [discountValue, setDiscountValue] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [stock, setStock] = useState('');
  const [validityDays, setValidityDays] = useState('30');

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const createMutation = useCreateRewardMutation();

  const validateForm = (): CreateRewardDTO | null => {
    const nextErrors: FormErrors = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      nextErrors.title = 'O título da recompensa é obrigatório.';
    } else if (trimmedTitle.length < 3) {
      nextErrors.title = 'O título deve ter pelo menos 3 caracteres.';
    }

    const parsedDiscount = parseFloat(discountValue.replace(',', '.'));
    if (!discountValue.trim() || isNaN(parsedDiscount) || parsedDiscount <= 0) {
      nextErrors.discountValue = 'Informe um valor de desconto maior que zero.';
    } else if (discountType === 'PERCENTAGE' && parsedDiscount > 100) {
      nextErrors.discountValue = 'O desconto percentual não pode ultrapassar 100%.';
    }

    const parsedPoints = parseInt(pointsCost.replace(/\D/g, ''), 10);
    if (!pointsCost.trim() || isNaN(parsedPoints) || parsedPoints <= 0) {
      nextErrors.pointsCost = 'O custo em pontos deve ser maior que zero.';
    }

    let parsedStock: number | null = null;
    if (stock.trim() !== '') {
      const numStock = parseInt(stock.replace(/\D/g, ''), 10);
      if (isNaN(numStock) || numStock < 1) {
        nextErrors.stock = 'O estoque deve ser de pelo menos 1 unidade (ou deixe vazio para ilimitado).';
      } else {
        parsedStock = numStock;
      }
    }

    const parsedValidity = parseInt(validityDays.replace(/\D/g, ''), 10);
    if (!validityDays.trim() || isNaN(parsedValidity) || parsedValidity < 1) {
      nextErrors.validityDays = 'A validade deve ser de pelo menos 1 dia.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      title: trimmedTitle,
      description: description.trim() || null,
      discountType,
      discountValue: parsedDiscount,
      pointsCost: parsedPoints,
      stock: parsedStock,
      validityDays: parsedValidity,
    };
  };

  const handleSave = () => {
    setApiError(null);
    const payload = validateForm();
    if (!payload) return;

    createMutation.mutate(payload, {
      onSuccess: () => {
        if (Platform.OS === 'web') {
          router.replace('/(merchant)/rewards');
        } else {
          Alert.alert('Recompensa Criada', 'O cupom foi adicionado ao catálogo com sucesso!', [
            {
              text: 'OK',
              onPress: () => router.replace('/(merchant)/rewards'),
            },
          ]);
        }
      },
      onError: (err: unknown) => {
        const maybeAxios = err as { response?: { data?: { message?: string } } };
        setApiError(
          maybeAxios?.response?.data?.message ||
            'Não foi possível salvar a recompensa. Verifique os dados e tente novamente.'
        );
      },
    });
  };

  const previewDiscount = (() => {
    const val = parseFloat(discountValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      return discountType === 'PERCENTAGE' ? '0% OFF' : 'R$ 0,00 OFF';
    }
    return discountType === 'PERCENTAGE'
      ? `${val}% OFF`
      : `R$ ${val.toFixed(2).replace('.', ',')} OFF`;
  })();

  const previewPoints = parseInt(pointsCost.replace(/\D/g, ''), 10) || 0;

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Top Header */}
        <View className="px-6 py-4 bg-white border-b border-neutros-borda flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
          >
            <Ionicons name="arrow-back" size={20} color="#171717" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-neutros-texto">
              Nova Recompensa
            </Text>
            <Text className="text-xs text-neutros-cinza">
              Configure o benefício para resgate com pontos
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerClassName="p-6 pb-12"
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview em tempo real */}
          <View
            style={{ backgroundColor: '#6F35B5' }}
            className="bg-lojista p-5 rounded-3xl shadow-md mb-6"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/80 text-xs font-bold uppercase tracking-wider">
                Prévia do Cupom
              </Text>
              <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center gap-1">
                <Ionicons name="sparkles" size={12} color="#F5B800" />
                <Text className="text-white text-xs font-extrabold">
                  {previewPoints} pts
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-white text-lg font-extrabold" numberOfLines={1}>
                  {title.trim() || 'Título da Recompensa'}
                </Text>
                <Text className="text-white/80 text-xs mt-0.5" numberOfLines={1}>
                  {description.trim() || 'Descrição do benefício para o consumidor'}
                </Text>
              </View>
              <View className="bg-white px-3 py-1.5 rounded-2xl">
                <Text className="text-lojista text-sm font-black">
                  {previewDiscount}
                </Text>
              </View>
            </View>
          </View>

          {/* Banner de erro da API */}
          {apiError && (
            <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex-row items-center gap-2.5">
              <Ionicons name="alert-circle" size={20} color="#D64545" />
              <Text className="text-xs text-red-700 font-semibold flex-1">
                {apiError}
              </Text>
            </View>
          )}

          {/* Card do Formulário */}
          <View className="bg-white p-6 rounded-3xl border border-neutros-borda shadow-sm gap-5">
            {/* 1. Título */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">
                Título da Recompensa *
              </Text>
              <TextInput
                testID="input-reward-title"
                value={title}
                onChangeText={(val) => {
                  setTitle(val);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="Ex: Cupom R$ 10 OFF"
                placeholderTextColor="#9CA3AF"
                maxLength={120}
                className={`w-full h-12 px-4 rounded-xl bg-neutros-fundo border text-neutros-texto text-base ${
                  errors.title ? 'border-red-500' : 'border-neutros-borda'
                }`}
              />
              {errors.title && (
                <Text className="text-xs text-red-600 font-medium mt-1.5">
                  {errors.title}
                </Text>
              )}
            </View>

            {/* 2. Descrição */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">
                Descrição
              </Text>
              <TextInput
                testID="input-reward-description"
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Válido em compras acima de R$ 50,00"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="w-full min-h-[84px] p-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base"
              />
            </View>

            {/* 3. Seletor Tipo de Desconto (R$ / %) */}
            <View>
              <Text className="text-sm font-semibold text-neutros-texto mb-2">
                Tipo de Desconto *
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  testID="selector-discount-fixed"
                  activeOpacity={0.85}
                  onPress={() => {
                    setDiscountType('FIXED_AMOUNT');
                    if (errors.discountValue) {
                      setErrors((prev) => ({ ...prev, discountValue: undefined }));
                    }
                  }}
                  style={{
                    backgroundColor:
                      discountType === 'FIXED_AMOUNT' ? '#6F35B5' : '#F7F8FA',
                    borderColor:
                      discountType === 'FIXED_AMOUNT' ? '#6F35B5' : '#E5E7EB',
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl border flex-row items-center justify-center gap-2"
                >
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={discountType === 'FIXED_AMOUNT' ? '#FFFFFF' : '#666666'}
                  />
                  <Text
                    style={{
                      color: discountType === 'FIXED_AMOUNT' ? '#FFFFFF' : '#171717',
                    }}
                    className="text-xs font-extrabold"
                  >
                    Valor Fixo (R$)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="selector-discount-percentage"
                  activeOpacity={0.85}
                  onPress={() => {
                    setDiscountType('PERCENTAGE');
                    if (errors.discountValue) {
                      setErrors((prev) => ({ ...prev, discountValue: undefined }));
                    }
                  }}
                  style={{
                    backgroundColor:
                      discountType === 'PERCENTAGE' ? '#6F35B5' : '#F7F8FA',
                    borderColor:
                      discountType === 'PERCENTAGE' ? '#6F35B5' : '#E5E7EB',
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl border flex-row items-center justify-center gap-2"
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={18}
                    color={discountType === 'PERCENTAGE' ? '#FFFFFF' : '#666666'}
                  />
                  <Text
                    style={{
                      color: discountType === 'PERCENTAGE' ? '#FFFFFF' : '#171717',
                    }}
                    className="text-xs font-extrabold"
                  >
                    Percentual (%)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Valor do Desconto & 5. Custo em Pontos */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-neutros-texto mb-2">
                  {discountType === 'PERCENTAGE'
                    ? 'Desconto (%) *'
                    : 'Desconto (R$) *'}
                </Text>
                <TextInput
                  testID="input-reward-discount-value"
                  value={discountValue}
                  onChangeText={(val) => {
                    setDiscountValue(val);
                    if (errors.discountValue) {
                      setErrors((prev) => ({ ...prev, discountValue: undefined }));
                    }
                  }}
                  placeholder={discountType === 'PERCENTAGE' ? 'Ex: 15' : 'Ex: 10,00'}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  className={`w-full h-12 px-4 rounded-xl bg-neutros-fundo border text-neutros-texto text-base ${
                    errors.discountValue ? 'border-red-500' : 'border-neutros-borda'
                  }`}
                />
                {errors.discountValue && (
                  <Text className="text-xs text-red-600 font-medium mt-1.5">
                    {errors.discountValue}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-neutros-texto mb-2">
                  Custo em Pontos *
                </Text>
                <TextInput
                  testID="input-reward-points-cost"
                  value={pointsCost}
                  onChangeText={(val) => {
                    setPointsCost(val);
                    if (errors.pointsCost) {
                      setErrors((prev) => ({ ...prev, pointsCost: undefined }));
                    }
                  }}
                  placeholder="Ex: 100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className={`w-full h-12 px-4 rounded-xl bg-neutros-fundo border text-neutros-texto text-base ${
                    errors.pointsCost ? 'border-red-500' : 'border-neutros-borda'
                  }`}
                />
                {errors.pointsCost && (
                  <Text className="text-xs text-red-600 font-medium mt-1.5">
                    {errors.pointsCost}
                  </Text>
                )}
              </View>
            </View>

            {/* 6. Estoque (Opcional) & 7. Validade em Dias (Default 30) */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-neutros-texto mb-2">
                  Estoque (opcional)
                </Text>
                <TextInput
                  testID="input-reward-stock"
                  value={stock}
                  onChangeText={(val) => {
                    setStock(val);
                    if (errors.stock) {
                      setErrors((prev) => ({ ...prev, stock: undefined }));
                    }
                  }}
                  placeholder="Ilimitado"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className={`w-full h-12 px-4 rounded-xl bg-neutros-fundo border text-neutros-texto text-base ${
                    errors.stock ? 'border-red-500' : 'border-neutros-borda'
                  }`}
                />
                <Text className="text-[11px] text-neutros-cinza mt-1">
                  Vazio = sem limite de cupons
                </Text>
                {errors.stock && (
                  <Text className="text-xs text-red-600 font-medium mt-1">
                    {errors.stock}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-neutros-texto mb-2">
                  Validade (dias) *
                </Text>
                <TextInput
                  testID="input-reward-validity-days"
                  value={validityDays}
                  onChangeText={(val) => {
                    setValidityDays(val);
                    if (errors.validityDays) {
                      setErrors((prev) => ({ ...prev, validityDays: undefined }));
                    }
                  }}
                  placeholder="30"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className={`w-full h-12 px-4 rounded-xl bg-neutros-fundo border text-neutros-texto text-base ${
                    errors.validityDays ? 'border-red-500' : 'border-neutros-borda'
                  }`}
                />
                <Text className="text-[11px] text-neutros-cinza mt-1">
                  Prazo para uso após resgate
                </Text>
                {errors.validityDays && (
                  <Text className="text-xs text-red-600 font-medium mt-1">
                    {errors.validityDays}
                  </Text>
                )}
              </View>
            </View>

            {/* Botão de Salvar */}
            <TouchableOpacity
              testID="submit-reward-button"
              onPress={handleSave}
              disabled={createMutation.isPending}
              activeOpacity={0.85}
              style={{ backgroundColor: '#6F35B5' }}
              className="w-full h-13 py-3.5 bg-lojista rounded-2xl items-center justify-center flex-row gap-2 shadow-sm mt-2"
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text className="text-white text-base font-extrabold">
                    Salvar Recompensa
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
