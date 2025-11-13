// src/screens/MarketScreen.tsx
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

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
      <View style={styles.line1} />
    </View>
  );
}

/* ────────────── Market Content ────────────── */
function MarketContent() {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* 탭 영역 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.inactiveTab}
          onPress={() => navigation.navigate('Reward')}
        >
          <Text style={styles.inactiveTabText}>리워드</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.activeTab}>
          <Text style={styles.activeTabText}>마켓</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchBox}>
        <Image
          source={require('../../assets/main_icon/search.png')}
          style={styles.searchIcon}
        />
        <Text style={styles.searchText}>검색</Text>
      </View>

      {/* 브랜드 콘 섹션 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>브랜드 콘</Text>
      </View>

      {/* 브랜드 카테고리 */}
      <View style={styles.brandCategory}>
        <View style={styles.brandItem}>
          <Image
            source={require('../../assets/main_icon/LG.png')}
            style={styles.brandImage}
          />
          <Text style={styles.brandText}>LG전자</Text>
        </View>

        <View style={styles.brandItem}>
          <Image
            source={require('../../assets/main_icon/star.png')}
            style={styles.brandImage}
          />
          <Text style={styles.brandText}>LG생활건강</Text>
        </View>

        <View style={styles.brandItem}>
          <Image
            source={require('../../assets/main_icon/coffee.png')}
            style={styles.brandImage}
          />
          <Text style={styles.brandText}>카페</Text>
        </View>

        <View style={styles.brandItem}>
          <Image
            source={require('../../assets/main_icon/conv.png')}
            style={styles.brandImage}
          />
          <Text style={styles.brandText}>편의점</Text>
        </View>
      </View>

      {/* 추천 할인 쿠폰 섹션 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>추천 할인 쿠폰</Text>
      </View>

      {/* 쿠폰 카드 리스트 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.couponList}
      >
        <View style={styles.couponCard}>
          <Image
            source={require('../../assets/main_icon/chair.png')}
            style={styles.couponImage}
          />
          <Text style={styles.couponPoint}>170,000 P</Text>
          <Text style={styles.couponDesc}>
            LG 힐링미 오브제컬렉션 {'\n'}안마의자 10% 할인 쿠폰
          </Text>
        </View>

        <View style={styles.couponCard}>
          <Image
            source={require('../../assets/main_icon/puricare.png')}
            style={styles.couponImage}
          />
          <Text style={styles.couponPoint}>130,000 P</Text>
          <Text style={styles.couponDesc}>
            LG 퓨리케어 오브제컬렉션 {'\n'}정수기 5% 할인 쿠폰
          </Text>
        </View>

        <View style={styles.couponCard}>
          <Image
            source={require('../../assets/main_icon/aircon.png')}
            style={styles.couponImage}
          />
          <Text style={styles.couponPoint}>50,000 P</Text>
          <Text style={styles.couponDesc}>LG 휘센 AI 오브제컬렉션</Text>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

/* ────────────── Bottom Tab Bar ────────────── */
function BottomTabBar() {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/(tabs)')}
      >
        <Image
          source={require('../../assets/images/home.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/two')}>
        <Image
          source={require('../../assets/bars/challenge.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/three')}
      >
        <Image
          source={require('../../assets/bars/reward_active.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/four')}
      >
        <Image
          source={require('../../assets/bars/ranking.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

/* ────────────── Market Screen ────────────── */
export default function MarketScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <MarketContent />
      <BottomTabBar />
    </SafeAreaView>
  );
}

/* ────────────── Styles ────────────── */
const styles = StyleSheet.create({
  // 기본 레이아웃
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 120,
  },

  // Header
  header: {
    width: '100%',
    height: 53,
    marginTop: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    fontFamily: 'Agbalumo',
    fontSize: 20,
    color: '#353535',
  },
  settingButton: { position: 'absolute', right: 14, top: 15 },
  settingIcon: { width: 24, height: 24, tintColor: '#353535' },
  line1: {
    position: 'absolute',
    bottom: 0,
    height: 1,
    width: '100%',
    backgroundColor: '#E0E0E0',
  },

  // 탭
  tabContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginLeft: 22,
    marginTop: 30,
  },
  activeTab: {
    width: 76,
    height: 33,
    backgroundColor: '#FFF',
    borderRadius: 30,
    marginHorizontal: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveTab: {
    width: 76,
    height: 33,
    backgroundColor: '#F4F4F4',
    borderRadius: 30,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabText: {
    fontSize: 16,
    color: '#7B7B7B',
    fontFamily: 'Roboto-Medium',
  },
  inactiveTabText: {
    fontSize: 16,
    color: '#D8D8D8',
    fontFamily: 'Roboto-Medium',
  },

  // 검색
  searchBox: {
    width: 358,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#A3A3A3',
    marginRight: 10,
  },
  searchText: {
    fontSize: 16,
    color: '#A3A3A3',
    fontFamily: 'Roboto-regular',
  },

  // 섹션 타이틀
  sectionHeader: {
    width: '90%',
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#353535',
    fontFamily: 'Roboto-SemiBold',
    marginBottom: 5,
  },

  // 브랜드 카테고리
  brandCategory: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 3,
  },
  brandItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandImage: {
    width: 90,
    height: 85,
    resizeMode: 'cover',
    marginHorizontal: -2,
  },
  brandText: {
    fontSize: 14,
    color: '#A3A3A3',
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
    marginTop: -1,
  },

  // 쿠폰 카드
  couponList: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    left: 8,
  },
  couponCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: -2,
  },
  couponImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  couponPoint: {
    fontSize: 15,
    color: '#0D141C',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  couponDesc: {
    fontSize: 13,
    color: '#A0A0A0',
    fontFamily: 'Roboto',
  },

  // 하단 탭바
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 75,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  tabButton: { paddingVertical: 8, paddingHorizontal: 12 },
  tabIcon: { width: 50, height: 50 },
});
