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
  const { token, user, hydrateDone } = useAuthStore(); // ✅ Zustand에서 로그인 상태 불러오기
  const router = useRouter();
  const pathname = usePathname();

  // ✅ 로그인 상태 감시해서 자동 이동
  useEffect(() => {
    if (!hydrateDone) return;

    const isLoggedIn = !!token;
    const PUBLIC = [
      '/login',
      '/signup',
      '/onboarding-profile',
      '/onboarding-family',
      '/onboarding-avatar',
    ];

    const isPublic = PUBLIC.includes(pathname);

    if (!isLoggedIn && !isPublic) {
      router.replace('/login');
    }

    if (
      isLoggedIn &&
      (pathname === '/login' || pathname === '/signup') &&
      !user?.firstLogin // 첫 로그인이면 탭으로 이동 금지
    ) {
      router.replace('/(tabs)');
    }
  }, [hydrateDone, token, pathname, user?.firstLogin, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding-profile"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Setting" options={{ title: '설정' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
