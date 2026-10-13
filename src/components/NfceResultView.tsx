import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { NfceData, formatAccessKey, formatCurrency } from '@/utils/nfceParser';

interface NfceResultViewProps {
  data: NfceData;
  pointsAwarded?: number;
  balance?: number;
  rawHtml?: string;
  onReset: () => void;
  onBackToWebView?: () => void;
  onGoToHome?: () => void;
}

export function NfceResultView({
  data,
  pointsAwarded,
  balance,
  rawHtml,
  onReset,
  onBackToWebView,
  onGoToHome,
}: NfceResultViewProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showRawHtml, setShowRawHtml] = useState(false);

  const handleCopyKey = async () => {
    if (!data.info.chaveAcesso) return;
    await Clipboard.setStringAsync(data.info.chaveAcesso);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyJson = async () => {
    await Clipboard.setStringAsync(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <ScrollView
      className="flex-1 bg-neutros-fundo"
      contentContainerClassName="p-5 pb-12 gap-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Banner de Pontos ou Sucesso */}
      {pointsAwarded !== undefined ? (
        <View className="bg-consumidor p-6 rounded-3xl shadow-lg shadow-consumidor/30 items-center">
          <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mb-3 border border-white/30">
            <Ionicons name="checkmark-done" size={28} color="#FFFFFF" />
          </View>
          <Text className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
            Pontos Creditados
          </Text>
          <Text className="text-white text-4xl font-black tracking-tight mb-1">
            +{pointsAwarded}{' '}
            <Text className="text-xl font-bold text-pontos">pts</Text>
          </Text>
          {balance !== undefined && (
            <View className="mt-2 px-3 py-1 rounded-full bg-white/15 border border-white/20">
              <Text className="text-white text-xs font-semibold">
                Novo saldo na loja: {balance} pts
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View className="flex-row items-center bg-consumidor/10 border border-consumidor/20 p-4 rounded-2xl gap-3">
          <View className="w-10 h-10 rounded-full bg-consumidor items-center justify-center">
            <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-consumidor font-bold text-sm">
              NFC-e Processada com Sucesso
            </Text>
            <Text className="text-neutros-cinza text-xs">
              Dados extraídos diretamente da página da SEFAZ
            </Text>
          </View>
        </View>
      )}

      {/* Cartão do Estabelecimento e Total */}
      <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm gap-4">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-2xl bg-lojista/10 items-center justify-center">
            <Ionicons name="business" size={24} color="#6F35B5" />
          </View>
          <View className="flex-1">
            <Text selectable className="text-base font-extrabold text-neutros-texto leading-snug">
              {data.emitente.razaoSocial}
            </Text>
            {data.emitente.cnpj ? (
              <Text selectable className="text-xs text-neutros-cinza mt-0.5">
                CNPJ: {data.emitente.cnpj}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Valor Total em Destaque */}
        <View className="bg-consumidor/5 border border-consumidor/15 p-4 rounded-2xl items-center gap-1">
          <Text className="text-[11px] font-bold text-consumidor uppercase tracking-wider">
            Valor a Pagar
          </Text>
          <Text className="text-3xl font-black text-consumidor">
            {formatCurrency(data.totais.valorPagar || data.totais.valorTotal)}
          </Text>

          {Boolean(data.totais.desconto) && (
            <View className="flex-row gap-2 mt-1">
              <Text className="text-xs text-neutros-cinza">
                Produtos: {formatCurrency(data.totais.valorTotal)}
              </Text>
              <Text className="text-xs text-red-500 font-semibold">
                • Desconto: -{formatCurrency(data.totais.desconto!)}
              </Text>
            </View>
          )}

          <View className="flex-row gap-2 mt-1">
            <Text className="text-xs text-neutros-cinza">
              {data.totais.qtdItens} {data.totais.qtdItens === 1 ? 'item' : 'itens'}
            </Text>
            <Text className="text-xs text-neutros-cinza">
              • Pagamento: {data.totais.formaPagamento || 'Não informado'}
            </Text>
          </View>
        </View>
      </View>

      {/* Cartão de Dados Fiscais */}
      <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm gap-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm font-bold text-neutros-texto uppercase tracking-wider">
            Dados Fiscais
          </Text>
          <TouchableOpacity
            onPress={handleCopyKey}
            activeOpacity={0.7}
            className={`px-3 py-1.5 rounded-lg border flex-row items-center gap-1 ${
              copiedKey
                ? 'bg-consumidor/10 border-consumidor/30'
                : 'bg-neutros-fundo border-neutros-borda'
            }`}
          >
            <Ionicons
              name={copiedKey ? 'checkmark' : 'copy-outline'}
              size={12}
              color={copiedKey ? '#008D4C' : '#525252'}
            />
            <Text
              className={`text-[11px] font-bold ${
                copiedKey ? 'text-consumidor' : 'text-neutros-texto'
              }`}
            >
              {copiedKey ? 'Copiada' : 'Copiar Chave'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          selectable
          className="text-xs font-mono text-neutros-texto bg-neutros-fundo p-3 rounded-xl border border-neutros-borda leading-relaxed"
        >
          {formatAccessKey(data.info.chaveAcesso)}
        </Text>

        {Boolean(data.info.dataEmissao) && (
          <View className="flex-row justify-between items-center pt-2 border-t border-neutros-borda/60">
            <Text className="text-xs text-neutros-cinza">Data de Emissão</Text>
            <Text className="text-xs font-semibold text-neutros-texto">
              {data.info.dataEmissao}
            </Text>
          </View>
        )}

        {Boolean(data.info.numero) && (
          <View className="flex-row justify-between items-center pt-2 border-t border-neutros-borda/60">
            <Text className="text-xs text-neutros-cinza">Número / Série</Text>
            <Text className="text-xs font-semibold text-neutros-texto">
              {data.info.numero} (Série {data.info.serie || '1'})
            </Text>
          </View>
        )}

        {Boolean(data.consumidor?.documento) && (
          <View className="flex-row justify-between items-center pt-2 border-t border-neutros-borda/60">
            <Text className="text-xs text-neutros-cinza">Consumidor (CPF)</Text>
            <Text className="text-xs font-semibold text-neutros-texto">
              {data.consumidor.documento}
            </Text>
          </View>
        )}
      </View>

      {/* Lista de Produtos / Itens Comprados */}
      <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm gap-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm font-bold text-neutros-texto uppercase tracking-wider">
            Itens da Nota ({data.itens.length})
          </Text>
        </View>

        {data.itens.length > 0 ? (
          data.itens.map((item, idx) => (
            <View
              key={`${item.codigo}-${idx}`}
              className={`flex-row items-center justify-between py-2.5 ${
                idx > 0 ? 'border-t border-neutros-borda/60' : ''
              }`}
            >
              <View className="flex-1 pr-3">
                <Text
                  selectable
                  className="text-xs font-bold text-neutros-texto"
                  numberOfLines={2}
                >
                  {item.descricao}
                </Text>
                <Text className="text-[11px] text-neutros-cinza mt-0.5">
                  Cód: {item.codigo} • {item.quantidade} {item.unidade} x{' '}
                  {formatCurrency(item.valorUnitario)}
                </Text>
              </View>
              <Text selectable className="text-xs font-bold text-neutros-texto">
                {formatCurrency(item.valorTotal)}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-xs text-neutros-cinza italic py-2">
            Nenhum item individual estruturado identificado no HTML.
          </Text>
        )}
      </View>

      {/* Seção Técnica / Debug (Opcional) */}
      <View className="gap-2 mt-1">
        <TouchableOpacity
          onPress={() => setShowJson((prev) => !prev)}
          activeOpacity={0.7}
          className="py-2.5 px-4 rounded-xl bg-white border border-neutros-borda items-center"
        >
          <Text className="text-xs font-semibold text-neutros-cinza">
            {showJson ? '▲ Ocultar JSON Estruturado' : '▼ Visualizar JSON Estruturado'}
          </Text>
        </TouchableOpacity>

        {showJson && (
          <View className="bg-zinc-900 p-4 rounded-2xl relative">
            <TouchableOpacity
              onPress={handleCopyJson}
              activeOpacity={0.7}
              className={`absolute top-3 right-3 px-2.5 py-1 rounded-md z-10 ${
                copiedJson ? 'bg-consumidor' : 'bg-zinc-700'
              }`}
            >
              <Text className="text-white text-[10px] font-bold">
                {copiedJson ? '✓ Copiado' : 'Copiar'}
              </Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
              <Text selectable className="text-[11px] font-mono text-emerald-400">
                {JSON.stringify(data, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}

        {rawHtml ? (
          <TouchableOpacity
            onPress={() => setShowRawHtml((prev) => !prev)}
            activeOpacity={0.7}
            className="py-2.5 px-4 rounded-xl bg-white border border-neutros-borda items-center"
          >
            <Text className="text-xs font-semibold text-neutros-cinza">
              {showRawHtml ? '▲ Ocultar HTML Original' : '▼ Visualizar HTML Original'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {showRawHtml && rawHtml ? (
          <View className="bg-zinc-900 p-4 rounded-2xl">
            <ScrollView className="max-h-56" nestedScrollEnabled>
              <Text selectable className="text-[10px] font-mono text-zinc-300">
                {rawHtml.slice(0, 4000)}
              </Text>
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* Botões de Ação Final */}
      <View className="gap-3 mt-2">
        <TouchableOpacity
          onPress={onReset}
          activeOpacity={0.8}
          className="w-full h-14 bg-consumidor rounded-2xl items-center justify-center shadow-md shadow-consumidor/20 flex-row gap-2"
        >
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          <Text className="text-white font-bold text-base">Escanear Outra Nota</Text>
        </TouchableOpacity>

        {onBackToWebView && (
          <TouchableOpacity
            onPress={onBackToWebView}
            activeOpacity={0.7}
            className="w-full py-3.5 rounded-2xl border border-neutros-borda bg-white items-center justify-center flex-row gap-2"
          >
            <Ionicons name="globe-outline" size={18} color="#525252" />
            <Text className="text-neutros-texto font-bold text-sm">
              Rever Página da SEFAZ
            </Text>
          </TouchableOpacity>
        )}

        {onGoToHome && (
          <TouchableOpacity
            onPress={onGoToHome}
            activeOpacity={0.7}
            className="w-full py-3 items-center justify-center"
          >
            <Text className="text-neutros-cinza font-bold text-sm">
              Voltar ao Início
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
