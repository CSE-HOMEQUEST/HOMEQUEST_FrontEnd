// src/screens/OnboardingFamily.tsx
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';

import { useAuthStore } from '../store/useAuthStore';

export default function OnboardingFamily() {
  const router = useRouter(); // ✅ 추가
  const finishOnboarding = useAuthStore((s) => s.finishOnboarding);

  const [mode, setMode] = useState<'code' | 'new'>('code');

  // 가족 코드 입력
  const [familyCode, setFamilyCode] = useState('');
  const [codeResult, setCodeResult] = useState<null | boolean>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  // 새 가족 생성
  const [familyNickname, setFamilyNickname] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<null | boolean>(null);

  const inviteCode = 'WG371518';

  const handleStart = () => {
    if (isStartDisabled) return;

    // ✅ 온보딩 종료 처리 (firstLogin -> false)
    finishOnboarding();

    // ✅ 메인 탭으로 이동
    router.replace('/(tabs)');
  };

  /* 가족 코드 검증 */
  const handleCheckFamilyCode = () => {
    if (!familyCode.trim()) return;

    setIsCheckingCode(true);
    setCodeResult(null);

    // 임시 랜덤 (API 연결 시 변경)
    setTimeout(() => {
      const exists = Math.random() > 0.5;
      setCodeResult(exists);
      setIsCheckingCode(false);
    }, 800);
  };

  /* 새 가족 닉네임 중복확인 */
  const handleCheckFamilyName = () => {
    if (!familyNickname.trim()) return;

    setIsCheckingName(true);
    setNameAvailable(null);

    // 임시 랜덤 (API 연결 시 변경)
    setTimeout(() => {
      const ok = Math.random() > 0.5;
      setNameAvailable(ok);
      setIsCheckingName(false);
    }, 800);
  };

  /* 초대코드 복사 */
  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('복사 완료', '초대 코드가 복사되었습니다.');
  };

  /* 초대코드 공유 */
  const handleShare = async () => {
    await Share.share({
      message: `우리 가족 초대코드: ${inviteCode}\n함께 HomeQuest에서 시작해보자!`,
    });
  };

  /* 시작하기 버튼 비활성화 조건 */
  const isStartDisabled =
    (mode === 'code' && (familyCode.trim() === '' || codeResult !== true)) ||
    (mode === 'new' &&
      (familyNickname.trim() === '' || nameAvailable !== true));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 진행바 */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.progressStepText}>3/3</Text>
        </View>

        <Text style={styles.title}>우리 가족과 연결해요</Text>
        <Text style={styles.desc}>
          이미 가족이 있다면 코드를 입력하고,{'\n'}
          새로 시작하려면 가족코드를 만들어주세요.
        </Text>

        {/* 선택 탭 */}
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => {
              setMode('code');
              setNameAvailable(null);
            }}
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
            onPress={() => {
              setMode('new');
              setCodeResult(null);
            }}
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

        {/* 가족 코드 입력 모드 */}
        {mode === 'code' && (
          <>
            <View style={styles.codeInputWrapper}>
              <TextInput
                style={styles.codeInput}
                value={familyCode}
                onChangeText={(text) => {
                  setFamilyCode(text);
                  setCodeResult(null);
                }}
                placeholder="가족 코드 입력"
                placeholderTextColor="#C4C4C4"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.checkButton,
                familyCode.trim() !== '' && { backgroundColor: '#353535' },
              ]}
              disabled={familyCode.trim() === ''}
              onPress={handleCheckFamilyCode}
            >
              <Text
                style={[
                  styles.checkButtonText,
                  familyCode.trim() !== '' && { color: '#FFFFFF' },
                ]}
              >
                {isCheckingCode ? '확인 중...' : '코드 확인'}
              </Text>
            </TouchableOpacity>

            {codeResult === true && (
              <Text style={styles.availableText}>
                ✓ 가족코드가 확인되었습니다.
              </Text>
            )}
            {codeResult === false && (
              <Text style={styles.unavailableText}>
                ✕ 존재하지 않는 코드입니다.
              </Text>
            )}
            {codeResult === null && <View style={{ height: 16 }} />}
          </>
        )}

        {/* 새 가족 만들기 모드 */}
        {mode === 'new' && (
          <View style={styles.newFamilyArea}>
            <View style={styles.nicknameRow}>
              <View style={styles.nicknameInputWrapper}>
                <TextInput
                  style={styles.nicknameInput}
                  value={familyNickname}
                  onChangeText={(text) => {
                    setFamilyNickname(text);
                    setNameAvailable(null);
                  }}
                  placeholder="가족 닉네임"
                  placeholderTextColor="#C4C4C4"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.dupButton,
                  familyNickname.trim() !== '' && {
                    backgroundColor: '#353535',
                  },
                ]}
                disabled={familyNickname.trim() === ''}
                onPress={handleCheckFamilyName}
              >
                <Text
                  style={[
                    styles.dupButtonText,
                    familyNickname.trim() !== '' && { color: '#FFFFFF' },
                  ]}
                >
                  {isCheckingName ? '확인 중...' : '중복확인'}
                </Text>
              </TouchableOpacity>
            </View>

            {nameAvailable === true && (
              <Text style={styles.availableText}>
                ✓ 사용 가능한 가족 이름입니다.
              </Text>
            )}
            {nameAvailable === false && (
              <Text style={styles.unavailableText}>
                ✕ 이미 사용 중인 이름입니다.
              </Text>
            )}
            {nameAvailable === null && <View style={{ height: 16 }} />}

            {/* 초대 코드 */}
            <View style={styles.inviteBox}>
              <Text style={styles.inviteLabel}>나의 초대 코드</Text>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
            </View>

            <View style={styles.inviteButtonsRow}>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={handleCopyCode}
              >
                <Text style={styles.inviteButtonText}>초대 코드 복사하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inviteButton}
                onPress={handleShare}
              >
                <Text style={styles.inviteButtonText}>카톡으로 초대하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 시작 버튼 */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[
              styles.startButton,
              isStartDisabled
                ? styles.startButtonDisabled
                : styles.startButtonEnabled,
            ]}
            disabled={isStartDisabled}
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

/* --------------------- STYLES --------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingTop: 86, paddingHorizontal: 24 },

  /* 진행바 */
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
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#5A6FE9',
  },
  progressStepText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#121417',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#353535',
    marginBottom: 13,
  },
  desc: {
    fontSize: 16,
    color: '#353535',
    marginBottom: 24,
    lineHeight: 20,
  },

  /* 탭 */
  radioGroup: { marginBottom: 16 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
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
  radioOuterActive: { borderColor: '#353535' },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#353535',
  },
  radioLabel: { fontSize: 16, fontWeight: '600', color: '#353535' },

  /* 가족 코드 입력 */
  codeInputWrapper: {
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 12,
  },
  codeInput: { fontSize: 16 },

  checkButton: {
    height: 46,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkButtonText: { fontSize: 16, color: '#A0A0A0', fontWeight: '500' },

  /* 결과 표시 */
  availableText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 20,
    marginLeft: 4,
  },
  unavailableText: {
    color: '#E53935',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 20,
    marginLeft: 4,
  },

  /* 새 가족 만들기 */
  newFamilyArea: { marginTop: 4 },

  nicknameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  nicknameInputWrapper: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  nicknameInput: { fontSize: 16, color: '#353535' },

  dupButton: {
    width: 110,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dupButtonText: { fontSize: 16, color: '#A0A0A0', fontWeight: '500' },

  /* 초대코드 */
  inviteBox: {
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteLabel: { fontSize: 14, color: '#353535', marginBottom: 4 },
  inviteCode: { fontSize: 18, fontWeight: '700', color: '#353535' },

  inviteButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  inviteButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#353535',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },

  /* 시작하기 버튼 */
  bottomArea: { marginTop: 'auto', marginBottom: 32 },
  startButton: {
    height: 47,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: { backgroundColor: '#E0E0E0' },
  startButtonEnabled: { backgroundColor: '#353535' },
  startButtonText: { fontSize: 16, fontWeight: '700' },
  startButtonTextDisabled: { color: '#A0A0A0' },
  startButtonTextEnabled: { color: '#FFFFFF' },
});
