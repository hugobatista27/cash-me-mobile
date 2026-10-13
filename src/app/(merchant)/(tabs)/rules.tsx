import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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

import {
  useActiveLoyaltyRule,
  useSimulateLoyaltyRule,
  useUpdateLoyaltyRule,
} from '@/hooks/useLoyaltyRules';
import { EstablishmentProfile, useAuthStore } from '@/stores/use-auth-store';

export default function MerchantRulesScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const establishmentProfile = profile as EstablishmentProfile | null;
  const isOperator = establishmentProfile?.role === 'LOJISTA_OPERADOR';

  // 1. Regra Ativa
  const { data: activeRule, isLoading: isLoadingRule, isError: isErrorRule } = useActiveLoyaltyRule();

  // 2. Simulador Interativo
  const [simulationInput, setSimulationInput] = useState('100.00');
  const [debouncedAmount, setDebouncedAmount] = useState(100);

  useEffect(() => {
    const numeric = parseFloat(simulationInput.replace(',', '.'));
    const handler = setTimeout(() => {
      setDebouncedAmount(isNaN(numeric) || numeric < 0 ? 0 : numeric);
    }, 300);

    return () => clearTimeout(handler);
  }, [simulationInput]);

  const { data: simulationData, isFetching: isSimulating } = useSimulateLoyaltyRule(
    debouncedAmount,
    undefined,
    debouncedAmount > 0
  );

  // 3. Formulário de Edição de Nova Regra
  const [name, setName] = useState('');
  const [baseAmount, setBaseAmount] = useState('10');
  const [pointsPerBase, setPointsPerBase] = useState('1');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('0');
  const [maxPointsPerPurchase, setMaxPointsPerPurchase] = useState('');
  const [initializedRuleVersion, setInitializedRuleVersion] = useState<number | null>(null);

  // Sincroniza valores do formulário com a versão mais recente da regra
  if (activeRule && activeRule.version !== initializedRuleVersion) {
    setInitializedRuleVersion(activeRule.version);
    setName(activeRule.name || '');
    setBaseAmount(String(activeRule.baseAmount || '10'));
    setPointsPerBase(String(activeRule.pointsPerBase || '1'));
    setMinPurchaseAmount(String(activeRule.minPurchaseAmount ?? '0'));
    setMaxPointsPerPurchase(
      activeRule.maxPointsPerPurchase !== null && activeRule.maxPointsPerPurchase !== undefined
        ? String(activeRule.maxPointsPerPurchase)
        : ''
    );
  }

  const updateMutation = useUpdateLoyaltyRule();

  const handlePublishRule = async () => {
    if (isOperator) {
      Alert.alert('Acesso Restrito', 'Apenas LOJISTA_ADMIN pode publicar novas regras de pontuação.');
      return;
    }

    const parsedBase = parseFloat(baseAmount.replace(',', '.'));
    const parsedPoints = parseInt(pointsPerBase, 10);
    const parsedMinPurchase = parseFloat(minPurchaseAmount.replace(',', '.'));
    const parsedMaxPoints = maxPointsPerPurchase ? parseInt(maxPointsPerPurchase, 10) : null;

    if (isNaN(parsedBase) || parsedBase <= 0) {
      Alert.alert('Validação', 'O valor base deve ser maior que R$ 0,00.');
      return;
    }

    if (isNaN(parsedPoints) || parsedPoints < 1) {
      Alert.alert('Validação', 'Os pontos por base devem ser pelo menos 1 ponto.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        name: name.trim() || undefined,
        baseAmount: parsedBase,
        pointsPerBase: parsedPoints,
        minPurchaseAmount: isNaN(parsedMinPurchase) ? 0 : parsedMinPurchase,
        maxPointsPerPurchase: parsedMaxPoints,
      });

      Alert.alert('Sucesso', 'Nova versão da regra de fidelidade publicada com sucesso!');
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg =
        maybeAxios?.response?.data?.message || 'Falha ao publicar nova versão da regra de fidelidade.';
      Alert.alert('Erro', msg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="p-6">
          {/* Header da Tela */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-xs font-bold text-lojista uppercase tracking-wider">
                Políticas de Fidelidade
              </Text>
              <Text className="text-2xl font-extrabold text-neutros-texto">
                Regras e Simulador
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(merchant)/rules/history')}
              className="flex-row items-center gap-1.5 px-3 py-2 bg-lojista/10 rounded-2xl border border-lojista/20"
            >
              <Ionicons name="time-outline" size={16} color="#6F35B5" />
              <Text className="text-xs font-bold text-lojista">Histórico</Text>
            </TouchableOpacity>
          </View>

          {/* CARD 1: Regra Ativa */}
          <View className="bg-lojista p-6 rounded-3xl shadow-lg shadow-lojista/20 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Regra Ativa Oficial
                </Text>
              </View>
              {activeRule?.version && (
                <View className="bg-white/20 px-2.5 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    v{activeRule.version}
                  </Text>
                </View>
              )}
            </View>

            {isLoadingRule ? (
              <ActivityIndicator color="#FFFFFF" className="py-4" />
            ) : isErrorRule ? (
              <Text className="text-white/80 text-sm">
                Não foi possível carregar a regra ativa no momento.
              </Text>
            ) : (
              <>
                <Text className="text-white text-xl font-extrabold mb-1">
                  {activeRule?.name || 'Regra Padrão'}
                </Text>
                <Text className="text-white/95 text-base font-medium leading-relaxed mt-1">
                  {activeRule?.humanReadableSummary ||
                    `A cada R$ ${activeRule?.baseAmount?.toFixed(2)} você ganha ${activeRule?.pointsPerBase} ponto(s).`}
                </Text>

                <View className="flex-row gap-4 pt-4 mt-3 border-t border-white/20">
                  <View>
                    <Text className="text-white/70 text-xs">Compra Mínima</Text>
                    <Text className="text-white font-bold text-sm">
                      {activeRule?.minPurchaseAmount
                        ? `R$ ${activeRule.minPurchaseAmount.toFixed(2)}`
                        : 'Sem valor mín.'}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-white/70 text-xs">Teto de Pontos</Text>
                    <Text className="text-white font-bold text-sm">
                      {activeRule?.maxPointsPerPurchase
                        ? `${activeRule.maxPointsPerPurchase} pts`
                        : 'Sem limite'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* CARD 2: Simulador Interativo */}
          <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="calculator" size={20} color="#6F35B5" />
              <Text className="text-base font-bold text-neutros-texto">
                Simulador de Pontuação em Tempo Real
              </Text>
            </View>
            <Text className="text-xs text-neutros-cinza mb-4">
              Digite um valor de compra para visualizar a pontuação que seu cliente acumulará.
            </Text>

            <View className="mb-4">
              <Text className="text-xs font-semibold text-neutros-texto mb-1.5">
                Valor da Compra (R$)
              </Text>
              <TextInput
                className="w-full h-12 px-4 rounded-xl bg-neutros-fundo border border-neutros-borda text-neutros-texto text-base font-semibold"
                placeholder="100.00"
                placeholderTextColor="#A3A3A3"
                keyboardType="numeric"
                value={simulationInput}
                onChangeText={setSimulationInput}
              />
            </View>

            {/* Resultado da Simulação */}
            <View className="p-4 rounded-2xl bg-lojista/5 border border-lojista/10 items-center justify-center">
              {isSimulating ? (
                <ActivityIndicator size="small" color="#6F35B5" className="py-2" />
              ) : simulationData ? (
                <>
                  <Text className="text-xs font-bold text-lojista uppercase">
                    Pontos Calculados
                  </Text>
                  <Text className="text-3xl font-extrabold text-neutros-texto mt-1">
                    {simulationData.calculatedPoints}{' '}
                    <Text className="text-lg font-bold text-lojista">pts</Text>
                  </Text>
                  <Text className="text-xs text-neutros-cinza text-center mt-1">
                    {simulationData.humanReadableSummary}
                  </Text>
                </>
              ) : (
                <Text className="text-xs text-neutros-cinza">
                  Informe um valor acima de zero para simular.
                </Text>
              )}
            </View>
          </View>

          {/* CARD 3: Formulário de Edição / Publicação de Nova Regra */}
          <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="create-outline" size={20} color="#6F35B5" />
                <Text className="text-base font-bold text-neutros-texto">
                  Publicar Nova Versão da Regra
                </Text>
              </View>
              {isOperator && (
                <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                  <Text className="text-amber-800 text-[10px] font-bold">
                    Somente Leitura
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-neutros-cinza mb-4 leading-relaxed">
              Cada alteração gera uma nova versão imutável (RN04) que nunca altera compras retroativas.
            </Text>

            {/* Nome da Regra */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-neutros-texto mb-1.5">
                Nome ou Descrição da Regra
              </Text>
              <TextInput
                editable={!isOperator}
                className={`w-full h-12 px-4 rounded-xl border text-neutros-texto text-sm ${
                  isOperator
                    ? 'bg-neutros-fundo/50 border-neutros-borda text-neutros-cinza'
                    : 'bg-neutros-fundo border-neutros-borda'
                }`}
                placeholder="Ex: 1 ponto a cada R$ 10"
                placeholderTextColor="#A3A3A3"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Base Monetária e Pontos */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-neutros-texto mb-1.5">
                  A cada R$ (Base)
                </Text>
                <TextInput
                  editable={!isOperator}
                  className={`w-full h-12 px-4 rounded-xl border text-neutros-texto text-sm ${
                    isOperator
                      ? 'bg-neutros-fundo/50 border-neutros-borda text-neutros-cinza'
                      : 'bg-neutros-fundo border-neutros-borda'
                  }`}
                  placeholder="10.00"
                  placeholderTextColor="#A3A3A3"
                  keyboardType="numeric"
                  value={baseAmount}
                  onChangeText={setBaseAmount}
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-neutros-texto mb-1.5">
                  Ganha (Pontos)
                </Text>
                <TextInput
                  editable={!isOperator}
                  className={`w-full h-12 px-4 rounded-xl border text-neutros-texto text-sm ${
                    isOperator
                      ? 'bg-neutros-fundo/50 border-neutros-borda text-neutros-cinza'
                      : 'bg-neutros-fundo border-neutros-borda'
                  }`}
                  placeholder="1"
                  placeholderTextColor="#A3A3A3"
                  keyboardType="numeric"
                  value={pointsPerBase}
                  onChangeText={setPointsPerBase}
                />
              </View>
            </View>

            {/* Compra Mínima e Teto Máximo */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-neutros-texto mb-1.5">
                  Compra Mínima (R$)
                </Text>
                <TextInput
                  editable={!isOperator}
                  className={`w-full h-12 px-4 rounded-xl border text-neutros-texto text-sm ${
                    isOperator
                      ? 'bg-neutros-fundo/50 border-neutros-borda text-neutros-cinza'
                      : 'bg-neutros-fundo border-neutros-borda'
                  }`}
                  placeholder="0.00"
                  placeholderTextColor="#A3A3A3"
                  keyboardType="numeric"
                  value={minPurchaseAmount}
                  onChangeText={setMinPurchaseAmount}
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-neutros-texto mb-1.5">
                  Teto Máx. Pontos
                </Text>
                <TextInput
                  editable={!isOperator}
                  className={`w-full h-12 px-4 rounded-xl border text-neutros-texto text-sm ${
                    isOperator
                      ? 'bg-neutros-fundo/50 border-neutros-borda text-neutros-cinza'
                      : 'bg-neutros-fundo border-neutros-borda'
                  }`}
                  placeholder="Opcional"
                  placeholderTextColor="#A3A3A3"
                  keyboardType="numeric"
                  value={maxPointsPerPurchase}
                  onChangeText={setMaxPointsPerPurchase}
                />
              </View>
            </View>

            {/* Botão de Salvar / Publicar */}
            {!isOperator && (
              <TouchableOpacity
                onPress={handlePublishRule}
                disabled={updateMutation.isPending}
                activeOpacity={0.8}
                className="w-full h-13 bg-lojista rounded-2xl items-center justify-center shadow-sm"
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-bold">
                    Publicar Nova Regra (v{(activeRule?.version ?? 1) + 1})
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
