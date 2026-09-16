import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { getDatabase } from './db/database';
import { getSetting } from './db/repo';
import type { RootStackParamList } from './navigation/types';
import AddEntryScreen from './screens/AddEntryScreen';
import CurrencyScreen from './screens/CurrencyScreen';
import HomeScreen from './screens/HomeScreen';
import LedgerScreen from './screens/LedgerScreen';
import SettleUpScreen from './screens/SettleUpScreen';
import { color } from './theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  dark: true,
  colors: {
    primary: color.amber,
    background: color.ground,
    card: color.ground,
    text: color.ink,
    border: color.rule,
    notification: color.amber,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '600' },
    heavy: { fontFamily: 'System', fontWeight: '700' },
  },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [firstRun, setFirstRun] = useState(false);

  useEffect(() => {
    (async () => {
      await getDatabase();
      setFirstRun((await getSetting('currency')) === null);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={color.amber} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName={firstRun ? 'Currency' : 'Home'}
          screenOptions={{
            headerStyle: { backgroundColor: color.ground },
            headerTintColor: color.ink,
            headerTitleStyle: { fontSize: 17, fontWeight: '600' },
            contentStyle: { backgroundColor: color.ground },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Ledger"
            component={LedgerScreen}
            options={({ route }) => ({ title: route.params.name })}
          />
          <Stack.Screen name="AddEntry" component={AddEntryScreen} options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="SettleUp" component={SettleUpScreen} options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen
            name="Currency"
            component={CurrencyScreen}
            options={{ headerShown: false }}
            initialParams={{ firstRun }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: color.ground, alignItems: 'center', justifyContent: 'center' },
});
