// src/screens/OnboardingFamily.tsx
import { useRouter } from 'expo-router'; // ✅ 추가
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';

import { useAuthStore } from '../store/useAuthStore';

export default function OnboardingFamily() {
  const router = useRouter(); // ✅ 추가
  const finishOnboarding = useAuthStore((s) => s.finishOnboarding);

  // mode: 'code' = 가족 코드 입력, 'new' = 새 가족 만들기
  const [mode, setMode] = useState<'code' | 'new'>('code');
  const [familyCode, setFamilyCode] = useState('');
  const [familyNickname, setFamilyNickname] = useState('');

  const handleClearNickname = () => setFamilyNickname('');

  const handleStart = () => {
    if (isStartDisabled) return;

    // ✅ 온보딩 종료 처리 (firstLogin -> false)
    finishOnboarding();

    // ✅ 메인 탭으로 이동
    router.replace('/(tabs)');
  };

  const isStartDisabled =
    (mode === 'code' && familyCode.trim() === '') ||
    (mode === 'new' && familyNickname.trim() === '');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 상단 진행바 3/3 */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.progressStepText}>3/3</Text>
        </View>

        {/* 타이틀 + 설명 */}
        <Text style={styles.title}>우리 가족과 연결해요</Text>
        <Text style={styles.desc}>
          이미 가족이 있다면 코드를 입력하고,{'\n'}
          새로 시작하려면 가족코드를 만들어주세요.
        </Text>

        {/* 가족 코드 입력 / 새 가족 만들기 토글 */}
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioRow}
            activeOpacity={0.8}
            onPress={() => setMode('code')}
          >
            <View
              style={[
                styles.radioOuter,
                mode === 'code' && styles.radioOuterActive,
              ]}
            >
              {mode === 'code' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>가족 코드 입력</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioRow}
            activeOpacity={0.8}
            onPress={() => setMode('new')}
          >
            <View
              style={[
                styles.radioOuter,
                mode === 'new' && styles.radioOuterActive,
              ]}
            >
              {mode === 'new' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>새 가족 만들기</Text>
          </TouchableOpacity>
        </View>

        {/* 1) 가족 코드 입력 모드 */}
        {mode === 'code' && (
          <View style={styles.codeInputWrapper}>
            <TextInput
              style={styles.codeInput}
              value={familyCode}
              onChangeText={setFamilyCode}
              placeholder="가족 코드 입력"
              placeholderTextColor="#C4C4C4"
            />
          </View>
        )}

        {/* 2) 새 가족 만들기 모드 */}
        {mode === 'new' && (
          <View style={styles.newFamilyArea}>
            {/* 가족 닉네임 + X + 중복확인 */}
            <View style={styles.nicknameRow}>
              <View style={styles.nicknameInputWrapper}>
                <TextInput
                  style={styles.nicknameInput}
                  value={familyNickname}
                  onChangeText={setFamilyNickname}
                  placeholder="가족 닉네임"
                  placeholderTextColor="#C4C4C4"
                />

                {familyNickname.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    activeOpacity={0.7}
                    onPress={handleClearNickname}
                  >
                    <Image
                      source={require('../../assets/images/si_close-circle-fill.png')}
                      style={styles.clearButtonIcon}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.dupButton}
                activeOpacity={0.8}
                onPress={() => {}}
              >
                <Text style={styles.dupButtonText}>중복확인</Text>
              </TouchableOpacity>
            </View>

            {/* 초대 코드 박스 */}
            <View style={styles.inviteBox}>
              <Text style={styles.inviteLabel}>나의 초대 코드</Text>
              <Text style={styles.inviteCode}>WG371518</Text>
            </View>

            {/* 복사 / 카톡 초대 버튼 */}
            <View style={styles.inviteButtonsRow}>
              <TouchableOpacity style={styles.inviteButton} activeOpacity={0.8}>
                <Text style={styles.inviteButtonText}>초대 코드 복사하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inviteButton} activeOpacity={0.8}>
                <Text style={styles.inviteButtonText}>카톡으로 초대하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 하단 시작하기 버튼 */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[
              styles.startButton,
              isStartDisabled
                ? styles.startButtonDisabled
                : styles.startButtonEnabled,
            ]}
            activeOpacity={isStartDisabled ? 1 : 0.8}
            onPress={handleStart}
          >
            <Text
              style={[
                styles.startButtonText,
                isStartDisabled
                  ? styles.startButtonTextDisabled
                  : styles.startButtonTextEnabled,
              ]}
            >
              시작하기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// 이하 styles 그대로…
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingTop: 86,
    paddingHorizontal: 24,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DBE0E5',
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#5A6FE9',
  },
  progressStepText: {
    fontSize: 16,
    color: '#121417',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Roboto',
    color: '#353535',
    marginBottom: 13,
  },
  desc: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#353535',
    lineHeight: 20,
    marginBottom: 28,
    fontWeight: '400',
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioOuterActive: {
    borderColor: '#353535',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#353535',
  },
  radioLabel: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#353535',
    fontWeight: '600',
  },
  codeInputWrapper: {
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  codeInput: {
    fontSize: 16,
    color: '#A3A3A3',
    fontWeight: '400',
  },
  newFamilyArea: {
    marginTop: 4,
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    columnGap: 8,
  },
  nicknameInputWrapper: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  nicknameInput: {
    flex: 1,
    fontSize: 16,
    color: '#353535',
    fontWeight: '400',
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  dupButton: {
    width: 110,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dupButtonText: {
    fontSize: 16,
    color: '#A0A0A0',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  inviteBox: {
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteLabel: {
    fontSize: 14,
    color: '#353535',
    fontFamily: 'Roboto',
    marginBottom: 4,
    fontWeight: '400',
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Roboto',
    color: '#353535',
  },
  inviteButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 8,
    marginBottom: 24,
  },
  inviteButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#353535',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bottomArea: {
    marginTop: 'auto',
    marginBottom: 32,
  },
  startButton: {
    height: 47,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  startButtonEnabled: {
    backgroundColor: '#353535',
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: '700',
  },
  startButtonTextDisabled: {
    color: '#A0A0A0',
  },
  startButtonTextEnabled: {
    color: '#FFFFFF',
  },
});
