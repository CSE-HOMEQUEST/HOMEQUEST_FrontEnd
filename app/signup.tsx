// app/signup.tsx
import { useRouter } from 'expo-router';
import React from 'react';
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

export default function SignupScreen() {
  const router = useRouter();

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
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="비밀번호 확인"
              placeholderTextColor="#C4C4C4"
              secureTextEntry
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
              />

              <Text style={styles.atText}>@</Text>

              <TouchableOpacity
                style={[styles.input, styles.emailRightInput]}
                activeOpacity={0.8}
              >
                <View style={styles.emailRightInner}>
                  <Text style={styles.emailRightPlaceholder}>선택</Text>
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
              />

              <TouchableOpacity style={styles.smallButton} activeOpacity={0.8}>
                <Text style={styles.smallButtonText}>인증번호 받기</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 가입하기 (비활성화 스타일) */}
          <TouchableOpacity
            style={styles.submitButtonDisabled}
            activeOpacity={1}
          >
            <Text style={styles.submitButtonTextDisabled}>가입하기</Text>
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
