// app/signup.tsx
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useAuthStore } from '@/src/store/useAuthStore';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [emailLocal, setEmailLocal] = useState('');
  const [emailDomain, setEmailDomain] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  // ✅ 이메일 조합 (왼쪽에 전체 이메일 입력 가능)
  const email = useMemo(() => {
    const v = emailLocal.trim();
    if (v.includes('@')) return v; // @ 포함 시 그대로 사용
    if (emailDomain) return `${v}@${emailDomain}`;
    return '';
  }, [emailLocal, emailDomain]);

  // ✅ 검증 함수들
  const isValidEmail = (s: string) => /\S+@\S+\.\S+/.test(s); // 기존보다 느슨
  const isValidPhone = (s: string) => /^01[0-9]\d{7,8}$/.test(s);
  const canSubmit =
    userId.trim().length > 0 &&
    password.length > 0 &&
    password === password2 &&
    isValidEmail(email) &&
    isValidPhone(phone) &&
    !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await signUp({ userId, password, email, phone });
      // 실제로는 {userId, password, email, phone} 등 서버 스펙에 맞추세요
      router.replace('/login'); // 회원가입 후 로그인 화면으로
    } catch (e) {
      console.log('회원가입 오류', e);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => router.back()}
          >
            {/* X 아이콘 */}
            <Image
              source={require('../assets/images/si_close-duotone(1).png')}
              style={styles.headerIcon}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>회원가입</Text>

          {/* 오른쪽은 비워두기 (정렬용) */}
          <View style={styles.headerRight} />
        </View>

        {/* 폼 영역 */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 아이디 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>아이디</Text>

            <View style={styles.row}>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.input}
                  placeholder="아이디"
                  placeholderTextColor="#C4C4C4"
                  value={userId}
                  onChangeText={setUserId}
                />
                {/* 입력값 지우기 아이콘 */}
                <TouchableOpacity style={styles.clearButton}>
                  <Image
                    source={require('../assets/images/si_close-circle-fill.png')}
                    style={styles.clearIcon}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.smallButton} activeOpacity={0.8}>
                <Text style={styles.smallButtonText}>중복확인</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 비밀번호 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>비밀번호</Text>

            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#C4C4C4"
              secureTextEntry
              textContentType="oneTimeCode" // iOS가 비밀번호로 안 봄
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              value={password} // ✅ 바인딩 추가
              onChangeText={setPassword}
            />
            <TextInput
              style={[styles.input, styles.inputGap]}
              placeholder="비밀번호 확인"
              placeholderTextColor="#C4C4C4"
              secureTextEntry
              textContentType="oneTimeCode" // iOS가 비밀번호로 안 봄
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              value={password2} // ✅ 바인딩 추가
              onChangeText={setPassword2}
            />
          </View>

          {/* 이메일 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>이메일</Text>

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.emailLeftInput]}
                placeholder="이메일"
                placeholderTextColor="#C4C4C4"
                value={emailLocal}
                onChangeText={setEmailLocal}
              />

              <Text style={styles.atText}>@</Text>

              <TouchableOpacity
                style={[styles.input, styles.emailRightInput]}
                activeOpacity={0.8}
                onPress={() => setEmailDomain('gmail.com')}
              >
                <View style={styles.emailRightInner}>
                  <Text style={styles.emailRightPlaceholder}>
                    {emailDomain || '선택'}
                  </Text>
                  <Image
                    source={require('../assets/images/si_expand-more-duotone.png')}
                    style={styles.dropdownIcon}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 휴대폰 번호 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>휴대폰 번호</Text>

            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="휴대폰 번호"
                placeholderTextColor="#C4C4C4"
                keyboardType="number-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <TouchableOpacity style={styles.smallButton} activeOpacity={0.8}>
                <Text style={styles.smallButtonText}>인증번호 받기</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 가입하기 (비활성화 스타일) */}
          <TouchableOpacity
            style={[
              styles.submitButtonDisabled,
              canSubmit && { backgroundColor: '#353535' },
            ]}
            activeOpacity={canSubmit ? 0.8 : 1}
            disabled={!canSubmit || isLoading}
            onPress={handleSubmit}
          >
            <Text
              style={[
                styles.submitButtonTextDisabled,
                canSubmit && { color: '#FFFFFF' },
              ]}
            >
              {isLoading ? '처리 중...' : '가입하기'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* 헤더 */
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 16,
    marginTop: 44,
  },
  headerLeft: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
  },
  headerIcon: {
    width: 41,
    height: 41,
    resizeMode: 'contain',
    tintColor: '#353535',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: '#353535',
  },

  /* 스크롤 콘텐츠 */
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: '#353535',
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Roboto',
    color: '#353535',
    fontWeight: '400',
  },

  /* 아이디 입력 + X 아이콘 */
  inputWithIcon: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  clearIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#C4C4C4',
  },
  inputGap: { marginTop: 8 },

  /* 오른쪽 작은 버튼 (중복확인 / 인증번호 받기) */
  smallButton: {
    marginLeft: 8,
    width: 96,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButtonText: {
    fontSize: 13,
    color: '#A0A0A0',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },

  /* 이메일 인풋 */
  emailLeftInput: {
    flex: 0.9,
  },
  emailRightInput: {
    flex: 1.1,
    paddingHorizontal: 0,
  },
  atText: {
    marginHorizontal: 6,
    fontSize: 14,
    fontFamily: 'Roboto',
    color: '#353535',
    fontWeight: '500',
  },
  emailRightInner: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailRightPlaceholder: {
    fontSize: 14,
    color: '#C4C4C4',
    fontFamily: 'Roboto',
  },
  dropdownIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    tintColor: '#C4C4C4',
  },

  /* 가입하기 버튼 (비활성화) */
  submitButtonDisabled: {
    marginTop: 90,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonTextDisabled: {
    fontSize: 16,
    color: '#A0A0A0',
    fontFamily: 'Roboto',
  },
});
