import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/stores/use-auth-store';

export default function ConsumerLayout() {
  const { isAuthenticated, user, isRestoringSession } = useAuthStore();

  if (isRestoringSession) {
    return (
      <View className="flex-1 bg-neutros-fundo items-center justify-center">
        <ActivityIndicator size="large" color="#008D4C" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.userType === 'ESTABLISHMENT') {
    return <Redirect href="/(merchant)/(tabs)" />;
  }

  if (user?.userType !== 'CUSTOMER') {
    return <Redirect href="/(auth)/login" />;
  }

  return <Slot />;
}
