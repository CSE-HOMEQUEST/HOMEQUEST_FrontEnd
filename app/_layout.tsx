// app/_layout.tsx

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/src/components/useColorScheme';
import { useAuthStore } from '@/src/store/useAuthStore'; // ✅ Zustand store 추가

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Agbalumo: require('../assets/fonts/Agbalumo-Regular.ttf'),
    Roboto: require('../assets/fonts/Roboto.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { token } = useAuthStore(); // ✅ Zustand에서 로그인 상태 불러오기
  const router = useRouter();
  const pathname = usePathname();

  // ✅ 로그인 상태 감시해서 자동 이동
  useEffect(() => {
    const isLoggedIn = !!token;
    const isPublic =
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname.startsWith('/onboarding'); // 선택

    if (!isLoggedIn && !isPublic) {
      router.replace('/login');
    } else if (
      isLoggedIn &&
      (pathname === '/login' || pathname === '/signup')
    ) {
      router.replace('/(tabs)');
    }
  }, [token, pathname, router]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="Setting" options={{ title: '설정' }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />{' '}
          {/* ✅ 로그인 페이지 등록 */}
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
