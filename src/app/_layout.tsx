import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth';
import { cores } from '../components/ui';

function Navegacao() {
  const { session, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: cores.fundo } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" options={{ title: 'Encomendas' }} />
        <Stack.Screen name="escanear" options={{ title: 'Nova encomenda' }} />
        <Stack.Screen name="encomenda/[id]" options={{ title: 'Encomenda' }} />
        <Stack.Screen name="cadastros" options={{ title: 'Apartamentos e moradores' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Navegacao />
    </AuthProvider>
  );
}
