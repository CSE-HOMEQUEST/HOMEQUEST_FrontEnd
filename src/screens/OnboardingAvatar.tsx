// src/screens/OnboardingAvatar.tsx
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.55;
const SIDE_SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

const avatars = [
  require('../../assets/images/Mom.png'),
  require('../../assets/images/Brother.png'),
  require('../../assets/images/Me.png'),
  require('../../assets/images/Dad.png'),
];

export default function OnboardingAvatar() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [selectedIndex, setSelectedIndex] = useState(0);

  /* 캐러셀 스크롤 이동 */
  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToOffset({
      offset: index * ITEM_WIDTH,
      animated: true,
    });
  };

  /* 스크롤 종료 시 선택된 아바타 갱신 */
  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    setSelectedIndex(index);
  };

  const handleNext = () => {
    router.push('/onboarding-family');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 진행바 */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.progressStepText}>2/3</Text>
        </View>

        {/* 타이틀 */}
        <Text style={styles.title}>나의 아바타를 선택해주세요</Text>

        {/* 아바타 캐러셀 */}
        <View style={styles.avatarRow}>
          <FlatList
            ref={flatListRef}
            data={avatars}
            keyExtractor={(_, idx) => String(idx)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            bounces={false}
            onMomentumScrollEnd={handleScrollEnd}
            contentContainerStyle={{ paddingHorizontal: SIDE_SPACING }}
            renderItem={({ item, index }) => {
              const isSelected = index === selectedIndex;
              return (
                <TouchableOpacity
                  style={[
                    styles.avatarWrapper,
                    {
                      opacity: isSelected ? 1 : 0.3,
                      transform: [{ scale: isSelected ? 1 : 0.85 }],
                    },
                  ]}
                  onPress={() => scrollToIndex(index)}
                  activeOpacity={0.9}
                >
                  <Image source={item} style={styles.avatarImage} />
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* 인디케이터 */}
        <View style={styles.dotsRow}>
          {avatars.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === selectedIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* 다음 버튼 */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              selectedIndex === null
                ? styles.nextButtonDisabled
                : styles.nextButtonEnabled,
            ]}
            onPress={handleNext}
            activeOpacity={selectedIndex === null ? 1 : 0.8}
          >
            <Text
              style={[
                styles.nextButtonText,
                selectedIndex === null
                  ? styles.nextButtonTextDisabled
                  : styles.nextButtonTextEnabled,
              ]}
            >
              다음으로
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  container: { flex: 1, paddingTop: 86 },

  /* 진행바 */
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
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
    width: '66%',
    height: '100%',
    backgroundColor: '#5A6FE9',
  },
  progressStepText: {
    fontSize: 16,
    color: '#121417',
    fontWeight: '500',
  },

  /* 타이틀 */
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#353535',
    marginBottom: 10,
    paddingHorizontal: 24,
  },

  /* 캐러셀 */
  avatarRow: {
    height: 380,
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 280,
    height: 360,
    resizeMode: 'contain',
  },

  /* 인디케이터 */
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#555555' },
  dotInactive: { backgroundColor: '#D9D9D9' },

  /* 다음 버튼 */
  bottomArea: { marginBottom: 32, paddingHorizontal: 24 },
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
