// src/screens/OnboardingProfile.tsx
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
} from 'react-native';

export default function OnboardingProfile() {
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [familyRole, setFamilyRole] = useState('');
  const [location, setLocation] = useState('');

  const isNextDisabled =
    nickname.trim() === '' ||
    familyRole.trim() === '' ||
    location.trim() === '';

  const handleClearNickname = () => {
    setNickname('');
  };

  const handleNext = () => {
    if (isNextDisabled) return;
    // 나중에는 서버에 저장하고 다음 단계로 이동
    router.push('/onboarding-avatar'); // 아직 없으면 TODO 상태여도 괜찮음
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 상단 진행바 1/3 */}
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>

        {/* 제목 */}
        <Text style={styles.title}>나를 소개해주세요 !</Text>

        {/* 폼 영역 */}
        <View style={styles.form}>
          {/* 닉네임 */}
          <Text style={styles.label}>닉네임</Text>
          <View style={styles.nicknameRow}>
            {/* 닉네임 입력 + 지우기 버튼 */}
            <View style={styles.nicknameInputWrapper}>
              <TextInput
                style={styles.nicknameInput}
                value={nickname}
                onChangeText={setNickname}
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

            {/* 중복확인 버튼 */}
            <TouchableOpacity
              style={styles.duplicateButton}
              activeOpacity={0.8}
              // TODO: 나중에 중복확인 로직 연결
              onPress={() => {}}
            >
              <Text style={styles.duplicateButtonText}>중복확인</Text>
            </TouchableOpacity>
          </View>

          {/* 가족 내 역할 */}
          <Text style={styles.label}>가족 내 역할</Text>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              value={familyRole}
              onChangeText={setFamilyRole}
              placeholder="가족 내 역할"
              placeholderTextColor="#C4C4C4"
            />
          </View>

          {/* 가족 거주지 */}
          <Text style={styles.label}>가족 거주지</Text>
          <View style={styles.locationInputWrapper}>
            <TextInput
              style={styles.locationInput}
              value={location}
              onChangeText={setLocation}
              placeholder="위치 검색"
              placeholderTextColor="#C4C4C4"
            />
            {/* 검색 아이콘*/}
            <TouchableOpacity
              style={styles.searchIconWrapper}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../assets/images/Vector-0.png')}
                style={styles.searchIconImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 하단 다음으로 버튼 */}
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 24,
  },

  /* 진행바 */
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DBE0E5',
    overflow: 'hidden',
    marginBottom: 50,
    marginTop: 86,
  },
  progressBarFill: {
    width: '33%', // 1/3 단계
    height: '100%',
    backgroundColor: '#5A6FE9',
  },

  /* 타이틀 */
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Roboto',
    color: '#353535',
    marginBottom: 30,
  },

  form: {
    flex: 1,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353535',
    marginBottom: 8,
  },

  /* 닉네임 행 */
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: 24,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
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

  nicknameInput: {
    flex: 1,
    fontSize: 16,
    color: '#353535',
    fontWeight: '400',
  },

  clearButtonText: {
    fontSize: 16,
    color: '#A0A0A0',
    fontWeight: '500',
  },
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

  /* 공통 입력 래퍼 */
  textInputWrapper: {
    height: 47,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  textInput: {
    fontSize: 16,
    color: '#A3A3A3',
    fontWeight: '400',
  },

  /* 위치 입력 */
  locationInputWrapper: {
    height: 47,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#A3A3A3',
    fontWeight: '400',
  },
  searchIconWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 9,
  },

  /* 하단 버튼 영역 */
  bottomArea: {
    marginTop: 40,
    marginBottom: 32,
  },
  nextButton: {
    height: 47,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonEnabled: {
    backgroundColor: '#353535',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: '700',
  },
  nextButtonTextDisabled: {
    color: '#A0A0A0',
  },
  nextButtonTextEnabled: {
    color: '#FFFFFF',
  },
});
