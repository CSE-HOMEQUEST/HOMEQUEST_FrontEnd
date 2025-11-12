import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

/* ────────────── Header ────────────── */
function Header() {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <View style={styles.header}>
      <Text style={styles.headerLogo}>HomeQuest</Text>
      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => navigation.navigate('Setting')}
      >
        <Image
          source={require('../../assets/bars/SettingButton.png')}
          style={styles.settingIcon}
        />
      </TouchableOpacity>
      <View style={styles.headerLine} />
    </View>
  );
}

/* ────────────── Character Content ────────────── */
function CharacterContent() {
  const [activeIndex, setActiveIndex] = useState(0);

  // 카드 스크롤 시 인덱스 업데이트
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / width);
    setActiveIndex(index);
  };

  return (
    <View style={styles.scrollContent}>
      {/* 배경 이미지 */}
      <Image
        source={require('../../assets/main_icon/back.png')}
        style={styles.background}
        resizeMode="cover"
      />

      {/* 캐릭터 섹션 */}
      <View style={styles.characterContainer}>
        <Image
          source={require('../../assets/bars/dongdong.png')}
          style={styles.characterImage}
          resizeMode="contain"
        />
        <Text style={styles.characterName}>동동이(동생)</Text>
        <View style={styles.line} />
      </View>

      {/* 캐릭터 정보 박스 배경 */}
      <View style={styles.infoBox} />

      {/* 진행 중인 챌린지 박스 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={351} // 카드 폭(331) + 간격(20)
        decelerationRate="fast"
        snapToAlignment="center"
        contentContainerStyle={{
          paddingHorizontal: (width - 351) / 2,
        }}
      >
        {/* 챌린지 카드 (1~3) */}
        {[1, 2, 3].map((_, i) => (
          <View key={i} style={styles.challengeBox}>
            <Text style={styles.challengeLabel}>진행 중인 챌린지</Text>
            <View style={styles.challengeInner}>
              <Image
                source={require('../../assets/bars/air.png')}
                style={styles.challengeIcon}
              />
              <View style={styles.challengeTextBox}>
                <Text style={styles.challengeTitle}>
                  어제보다 에어컨 사용량 줄이기
                </Text>
                <View style={styles.progressBarWrapper}>
                  <LinearGradient
                    colors={['#5A6FE9', '#9AA7F3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressBar}
                  />
                </View>
              </View>
              <ImageBackground
                source={require('../../assets/main_icon/bubble.png')}
                style={styles.pointTagImage}
              >
                <Text style={styles.pointText}>40p 획득!</Text>
              </ImageBackground>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 페이지 인디케이터 */}
      <View style={styles.pageIndicatorDots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={i === activeIndex ? styles.dotActive : styles.dotInactive}
          />
        ))}
      </View>

      {/* 챌린지 카드 섹션 */}
      <View style={styles.cardSection}>
        <Text style={styles.cardTitle}>챌린지 카드</Text>
        <View style={styles.cardContainer}>
          <Image
            source={require('../../assets/bars/card_1.png')}
            style={styles.cardImage}
          />
          <Image
            source={require('../../assets/bars/card_2.png')}
            style={styles.cardImage}
          />
          <Image
            source={require('../../assets/bars/card_3.png')}
            style={styles.cardImage}
          />
        </View>
      </View>
    </View>
  );
}

/* ────────────── Bottom Tab Bar ────────────── */
function BottomTabBar() {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity activeOpacity={0.7}>
        <Image
          source={require('../../assets/bars/home.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.7}>
        <Image
          source={require('../../assets/bars/challenge.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.7}>
        <Image
          source={require('../../assets/bars/reward.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.7}>
        <Image
          source={require('../../assets/bars/ranking.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

/* ────────────── Character Screen ────────────── */
export default function CharacterScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <View style={{ flex: 1 }}>
        <CharacterContent />
      </View>
      <BottomTabBar />
    </SafeAreaView>
  );
}

/* ────────────── Styles ────────────── */
const styles = StyleSheet.create({
  // 기본 레이아웃
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { alignItems: 'center', paddingBottom: 120 },

  // Header
  header: {
    width: '100%',
    height: 60,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  headerLogo: { fontFamily: 'Agbalumo', fontSize: 20, color: '#353535' },
  settingButton: { position: 'absolute', right: 20, top: 15 },
  settingIcon: { width: 24, height: 24, tintColor: '#353535' },
  headerLine: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
  },

  // 배경 이미지
  background: {
    position: 'absolute',
    width: 393,
    height: 659,
    top: 0,
    zIndex: -1,
  },

  // 캐릭터 정보 배경 박스
  infoBox: {
    position: 'absolute',
    width: 393,
    height: 508,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    marginTop: 140,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    zIndex: -1,
  },

  // 캐릭터
  characterContainer: { alignItems: 'center', marginTop: 10, zIndex: 1 },
  characterImage: {
    width: 165,
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  characterName: {
    fontSize: 22,
    fontFamily: 'Roboto-Bold',
    color: '#000',
    marginTop: -15,
  },
  line: {
    position: 'absolute',
    width: '80%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 220,
  },

  // 챌린지 박스
  challengeBox: {
    width: 331,
    height: 89,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 30,
    left: 10,
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 15,
  },
  challengeLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#A0A0A0',
    marginTop: -5,
    left: 5,
    marginBottom: -6,
  },
  challengeInner: { flexDirection: 'row', alignItems: 'center' },
  challengeIcon: {
    width: 78,
    height: 78,
    marginRight: 12,
    left: -2,
    marginTop: -6,
  },
  challengeTextBox: { flex: 1, marginTop: -10 },
  challengeTitle: { fontSize: 12, color: '#000', marginBottom: 8 },

  // 진행 바
  progressBarWrapper: {
    width: 195,
    height: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A0A0A0',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 1,
  },
  progressBar: { width: '70%', height: '100%', borderRadius: 6 },

  // 포인트 태그
  pointTagImage: {
    position: 'absolute',
    top: 15,
    right: -5,
    width: 49,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointText: {
    color: '#FFFFFF',
    fontSize: 8,
    position: 'absolute',
    top: 2,
    right: 7,
  },

  // 카드 섹션
  cardSection: {
    width: 331,
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 10,
    left: 5,
    marginTop: -6,
  },
  cardContainer: {
    flexDirection: 'row',
    marginTop: 3,
    justifyContent: 'center',
  },
  cardImage: { width: 69, height: 104, borderRadius: 5, marginHorizontal: 12 },

  // 페이지 인디케이터
  pageIndicatorDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -5,
    marginBottom: 10,
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#949494',
    marginHorizontal: 4,
  },

  // 하단 탭바
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 75,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    zIndex: 6,
  },
  tabButton: { paddingVertical: 8, paddingHorizontal: 12 },
  tabIcon: { width: 50, height: 50 },
});
