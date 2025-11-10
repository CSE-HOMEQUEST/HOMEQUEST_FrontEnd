// src/screens/OnboardingAvatar.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

// 한 “페이지”의 폭 (가운데 1개 꽉, 양 옆이 반쯤 보이게)
const ITEM_WIDTH = SCREEN_WIDTH * 0.5;
const SIDE_SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

const avatars = [
  require('../../assets/images/Mom.png'),
  require('../../assets/images/Brother.png'),
  require('../../assets/images/Me.png'),
  require('../../assets/images/Dad.png'),
];

export default function OnboardingAvatar() {
  const router = useRouter();

  // 가운데 선택된 인덱스
  const [selectedIndex, setSelectedIndex] = useState(1); // 처음엔 두 번째 것을 선택

  const handleNext = () => {
    // TODO: 선택한 아바타 서버에 저장 등
    router.push('/onboarding-family'); // 다음 단계(가족 연결 화면)로 이동 예정
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    setSelectedIndex(index);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 상단 진행바 2/3 */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.progressStepText}>2/3</Text>
        </View>

        {/* 제목 */}
        <Text style={styles.title}>나의 아바타를 생성해주세요</Text>

        {/* 아바타 캐러셀 */}
        <View style={styles.avatarRow}>
          <FlatList
            data={avatars}
            keyExtractor={(_, idx) => String(idx)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            bounces={false}
            onMomentumScrollEnd={handleScrollEnd}
            contentContainerStyle={{
              paddingHorizontal: SIDE_SPACING,
            }}
            renderItem={({ item, index }) => {
              const isSelected = index === selectedIndex;
              return (
                <View
                  style={[
                    styles.avatarWrapper,
                    {
                      opacity: isSelected ? 1 : 0.3, // 가운데 1, 양 옆 0.3
                      transform: [{ scale: isSelected ? 1 : 0.9 }],
                    },
                  ]}
                >
                  <Image source={item} style={styles.avatarImage} />
                </View>
              );
            }}
          />
        </View>

        {/* 페이지 인디케이터 (점 3개) */}
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

        {/* 하단 버튼 */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.nextButtonDisabled}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonTextDisabled}>다음으로</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 86,
  },

  /* 진행바 + 2/3 */
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
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
    width: '66%', // 2/3
    height: '100%',
    backgroundColor: '#5A6FE9',
  },
  progressStepText: {
    fontSize: 16,
    color: '#121417',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },

  /* 타이틀 */
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Roboto',
    color: '#353535',
    marginBottom: 5,
    paddingHorizontal: 24,
  },

  /* 아바타 캐러셀 컨테이너 */
  avatarRow: {
    height: 390,
    justifyContent: 'center',
    marginBottom: 0,
  },
  avatarWrapper: {
    width: ITEM_WIDTH - 9, // 아바타 간격을 좁히려면 폭을 줄임 (예: -10, -20)
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3, // 간격 미세조정
  },
  avatarImage: {
    width: 300,
    height: 400,
    resizeMode: 'contain',
  },

  /* 점 인디케이터 */
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
  dotActive: {
    backgroundColor: '#555555',
  },
  dotInactive: {
    backgroundColor: '#D9D9D9',
  },

  /* 하단 버튼 */
  bottomArea: {
    marginTop: 'auto',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  nextButtonDisabled: {
    height: 47,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonTextDisabled: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#A0A0A0',
    fontWeight: '700',
  },
});
