// app/login.tsx
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuthStore } from '@/src/store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, token, user, hydrateDone } = useAuthStore();

  useEffect(() => {
    if (!hydrateDone) return; // ✅ 스토어 수화 완료 후에만
    if (!token) return;

    if (user?.firstLogin) {
      router.replace('/onboarding-profile');
    } else {
      router.replace('/(tabs)');
    }
  }, [hydrateDone, token, user, router]);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (e) {
      console.log('로그인 실패:', e);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 로고 텍스트 */}
        <Text style={styles.logo}>HomeQuest</Text>

        {/* 아이디 입력 */}
        <TextInput
          style={styles.input}
          placeholder="아이디 입력"
          placeholderTextColor="#C4C4C4"
          value={email}
          onChangeText={setEmail}
        />

        {/* 비밀번호 입력 */}
        <TextInput
          style={styles.input}
          placeholder="비밀번호 입력"
          placeholderTextColor="#C4C4C4"
          secureTextEntry
          textContentType="none" // ✅ 자동 비밀번호 제안 끔
          autoComplete="off"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />

        {/* 로그인 버튼 */}
        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.8}
          disabled={isLoading}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Text>
        </TouchableOpacity>

        {/* 또는 구분선 */}
        <Text style={styles.orText}>또는</Text>

        {/* ThinQ 계정으로 계속하기 */}
        <TouchableOpacity style={styles.thinqButton} activeOpacity={0.8}>
          <Image
            source={require('../assets/images/ThinQLogo.png')}
            style={styles.thinqLogo}
          />
          <Text style={styles.thinqText}>ThinQ 계정으로 계속하기</Text>
        </TouchableOpacity>

        {/* 하단 링크들 */}
        <View style={styles.footerLinksRow}>
          <TouchableOpacity>
            <Text style={styles.footerLinkText}>아이디 찾기</Text>
          </TouchableOpacity>

          <Text style={styles.footerDivider}> | </Text>

          <TouchableOpacity>
            <Text style={styles.footerLinkText}>비밀번호 찾기</Text>
          </TouchableOpacity>

          <Text style={styles.footerDivider}> | </Text>

          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.footerLinkText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 120, // 위 여백 (로고 위치)
    backgroundColor: '#FFFFFF',
  },
  logo: {
    fontFamily: 'Agbalumo',
    fontSize: 32,
    color: '#5A6FE9',
    marginBottom: 60,
  },
  input: {
    width: 300,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Roboto',
    marginBottom: 12,
  },
  loginButton: {
    width: 300,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#353535',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  orText: {
    marginTop: 18,
    marginBottom: 12,
    fontSize: 14,
    color: '#A0A0A0',
    fontFamily: 'Roboto',
  },
  thinqButton: {
    width: 300,
    height: 46,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#353535',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  thinqLogo: {
    width: 29,
    height: 29,
    resizeMode: 'contain',
    marginRight: 8,
  },
  thinqText: {
    fontSize: 14,
    color: '#353535',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  footerLinkText: {
    fontSize: 14,
    color: '#353535',
    fontFamily: 'Roboto',
  },
  footerDivider: {
    fontSize: 12,
    color: '#A0A0A0',
    marginHorizontal: 6,
  },
});
