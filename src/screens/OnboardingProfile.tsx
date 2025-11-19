// src/screens/OnboardingProfile.tsx
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';

export default function OnboardingProfile() {
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [familyRole, setFamilyRole] = useState('');
  const [location, setLocation] = useState('');

  // 닉네임 중복확인 상태
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<null | boolean>(null);

  const roles = [
    '엄마',
    '아빠',
    '누나',
    '동생',
    '형',
    '언니',
    '오빠',
    '할아버지',
    '할머니',
  ];

  const isNextDisabled =
    nickname.trim() === '' ||
    familyRole.trim() === '' ||
    location.trim() === '';

  const isNicknameEntered = nickname.trim() !== '';

  const handleClearNickname = () => {
    setNickname('');
    setIsAvailable(null);
  };

  /* 닉네임 중복 확인 */
  const handleCheckNickname = () => {
    if (!nickname.trim()) return;

    setIsChecking(true);
    setIsAvailable(null);

    // 임시 랜덤 처리 (API 연결 시 변경)
    setTimeout(() => {
      const result = Math.random() > 0.5;
      setIsAvailable(result);
      setIsChecking(false);
    }, 800);
  };

  /* 위치 정보 가져오기 */
  const handleGetLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('알림', '위치 접근 권한이 필요합니다.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    const geo = await Location.reverseGeocodeAsync({
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    });

    if (geo[0]) {
      const addr = `${geo[0].region} ${geo[0].city} ${geo[0].district}`;
      setLocation(addr);
    }
  };

  const handleNext = () => {
    if (isNextDisabled) return;
    router.push('/onboarding-avatar');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 진행 바 */}
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>

        <Text style={styles.title}>나를 소개해주세요 !</Text>

        {/* 입력 폼 */}
        <View style={styles.form}>
          {/* 닉네임 입력 */}
          <Text style={styles.label}>닉네임</Text>

          <View style={styles.nicknameRow}>
            <View style={styles.nicknameInputWrapper}>
              <TextInput
                style={styles.nicknameInput}
                value={nickname}
                onChangeText={(text) => {
                  setNickname(text);
                  setIsAvailable(null);
                }}
                placeholder="닉네임"
                placeholderTextColor="#C4C4C4"
              />

              {nickname.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearNickname}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../assets/images/si_close-circle-fill.png')}
                    style={styles.clearButtonIcon}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* 닉네임 중복확인 */}
            <TouchableOpacity
              style={[
                styles.duplicateButton,
                isNicknameEntered && { backgroundColor: '#353535' },
              ]}
              activeOpacity={isNicknameEntered ? 0.8 : 1}
              disabled={!isNicknameEntered}
              onPress={handleCheckNickname}
            >
              <Text
                style={[
                  styles.duplicateButtonText,
                  isNicknameEntered && { color: '#FFFFFF' },
                ]}
              >
                {isChecking ? '확인 중...' : '중복확인'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 닉네임 중복확인 결과 */}
          {isAvailable === true && (
            <View style={styles.checkRow}>
              <Text style={styles.availableText}>
                ✓ 사용 가능한 닉네임입니다
              </Text>
            </View>
          )}

          {isAvailable === false && (
            <View style={styles.checkRow}>
              <Text style={styles.unavailableText}>
                ✕ 이미 사용 중인 닉네임입니다
              </Text>
            </View>
          )}

          {isAvailable === null && <View style={{ height: 16 }} />}

          {/* 가족 내 역할 선택 */}
          <Text style={styles.label}>가족 내 역할</Text>

          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleItem,
                  familyRole === role && { backgroundColor: '#353535' },
                ]}
                onPress={() => setFamilyRole(role)}
              >
                <Text
                  style={[
                    styles.roleText,
                    familyRole === role && { color: '#FFFFFF' },
                  ]}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 가족 거주지 */}
          <Text style={styles.label}>가족 거주지</Text>

          <View style={styles.locationInputWrapper}>
            <TextInput
              style={styles.locationInput}
              value={location}
              placeholder="현재 위치 가져오기"
              placeholderTextColor="#C4C4C4"
              editable={false}
            />

            <TouchableOpacity
              style={styles.searchIconWrapper}
              activeOpacity={0.7}
              onPress={handleGetLocation}
            >
              <Image
                source={require('../../assets/images/Vector-0.png')}
                style={styles.searchIconImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 다음 버튼 */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              isNextDisabled
                ? styles.nextButtonDisabled
                : styles.nextButtonEnabled,
            ]}
            activeOpacity={isNextDisabled ? 1 : 0.8}
            onPress={handleNext}
          >
            <Text
              style={[
                styles.nextButtonText,
                isNextDisabled
                  ? styles.nextButtonTextDisabled
                  : styles.nextButtonTextEnabled,
              ]}
            >
              다음으로
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* 스타일 */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingTop: 12, paddingHorizontal: 24 },

  /* 진행 바 */
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DBE0E5',
    overflow: 'hidden',
    marginBottom: 50,
    marginTop: 86,
  },
  progressBarFill: {
    width: '33%',
    height: '100%',
    backgroundColor: '#5A6FE9',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#353535',
    marginBottom: 30,
    fontFamily: 'Roboto-Bold',
  },

  form: { flex: 1 },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353535',
    marginBottom: 8,
    fontFamily: 'Roboto-SemiBold',
  },

  /* 닉네임 입력 */
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: 10,
  },

  nicknameInputWrapper: {
    flex: 1,
    height: 47,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  nicknameInput: { flex: 1, fontSize: 16, color: '#353535' },

  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonIcon: { width: 20, height: 20 },

  duplicateButton: {
    width: 130,
    height: 47,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  duplicateButtonText: {
    fontSize: 16,
    color: '#A0A0A0',
    fontWeight: '500',
  },

  /* 중복확인 결과 */
  checkRow: { marginBottom: 25, marginLeft: 4 },
  availableText: { color: '#4CAF50', fontSize: 14, fontWeight: '600' },
  unavailableText: { color: '#E53935', fontSize: 14, fontWeight: '600' },

  /* 가족 역할 */
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  roleItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
  },
  roleText: {
    fontSize: 14,
    color: '#353535',
    fontWeight: '500',
  },

  /* 거주지 */
  locationInputWrapper: {
    height: 47,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  locationInput: { flex: 1, fontSize: 16, color: '#A3A3A3' },
  searchIconWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconImage: { width: 20, height: 20 },

  /* 다음 버튼 */
  bottomArea: { marginTop: 40, marginBottom: 32 },
  nextButton: {
    height: 47,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: { backgroundColor: '#E0E0E0' },
  nextButtonEnabled: { backgroundColor: '#353535' },
  nextButtonText: { fontSize: 16, fontWeight: '700' },
  nextButtonTextDisabled: { color: '#A0A0A0' },
  nextButtonTextEnabled: { color: '#FFFFFF' },
});
