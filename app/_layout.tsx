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
  const { token, user, hydrateDone } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrateDone) return;

    const isLoggedIn = !!token;
    const firstLogin = user?.firstLogin === true;

    const PUBLIC_WHEN_LOGGED_OUT = ['/login', '/signup'];
    const ONBOARDING_PATHS = [
      '/onboarding-profile',
      '/onboarding-family',
      '/onboarding-avatar',
    ];

    const isPublicWhenLoggedOut = PUBLIC_WHEN_LOGGED_OUT.includes(pathname);
    const isOnboarding = ONBOARDING_PATHS.includes(pathname);

    // 1) 로그인 안 되어 있을 때: 로그인/회원가입 말고는 전부 /login으로
    if (!isLoggedIn) {
      if (!isPublicWhenLoggedOut) {
        router.replace('/login');
      }
      return;
    }

    // 2) 로그인 되어 있고, 첫 로그인인 경우: 온보딩 경로 밖이면 온보딩 첫 화면으로
    if (firstLogin) {
      if (!isOnboarding) {
        router.replace('/onboarding-profile');
      }
      return;
    }

    // 3) 로그인 되어 있고, 첫 로그인도 아닌 경우:
    //    온보딩 화면이나 로그인/회원가입 화면에 있으면 탭으로 보냄
    if (isOnboarding || isPublicWhenLoggedOut) {
      router.replace('/(tabs)');
      return;
    }
  }, [hydrateDone, token, user?.firstLogin, pathname, router]);

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
          <Stack.Screen
            name="onboarding-family"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="onboarding-avatar"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Setting" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
