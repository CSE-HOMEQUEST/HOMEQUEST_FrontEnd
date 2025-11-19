// src/screens/MarketScreen.tsx

import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

import { useRewardStore } from '../store/useRewardStore';

/* --------------------------------------------------------
   브랜드별 쿠폰 데이터
-------------------------------------------------------- */
const brandCoupons: Record<string, any[]> = {
  LG전자: [
    {
      point: '170,000 P',
      desc: 'LG 힐링미 오브제컬렉션 안마의자 10% 할인 쿠폰',
      image: require('../../assets/main_icon/chair.png'),
    },
    {
      point: '130,000 P',
      desc: 'LG 퓨리케어 정수기 5% 할인 쿠폰',
      image: require('../../assets/main_icon/puricare.png'),
    },
    {
      point: '50,000 P',
      desc: 'LG 휘센 AI 오브제컬렉션 3% 할인 쿠폰',
      image: require('../../assets/main_icon/aircon.png'),
    },
  ],

  LG생활건강: [
    {
      point: '15,000 P',
      desc: 'LG생활건강 생활용품 10% 할인 쿠폰',
      image: require('../../assets/main_icon/star.png'),
    },
    {
      point: '8,000 P',
      desc: 'LG생활건강 바디워시 5% 할인 쿠폰',
      image: require('../../assets/main_icon/star.png'),
    },
  ],

  카페: [
    {
      point: '5,000 P',
      desc: '카페 아메리카노 무료 쿠폰',
      image: require('../../assets/main_icon/coffee.png'),
    },
    {
      point: '3,000 P',
      desc: '카페 디저트 30% 할인 쿠폰',
      image: require('../../assets/main_icon/coffee.png'),
    },
  ],

  편의점: [
    {
      point: '3,000 P',
      desc: '편의점 3천원 쿠폰',
      image: require('../../assets/main_icon/conv.png'),
    },
    {
      point: '1,000 P',
      desc: '편의점 1천원 할인 쿠폰',
      image: require('../../assets/main_icon/conv.png'),
    },
  ],
};

/* --------------------------------------------------------
   Market Screen Main
-------------------------------------------------------- */
export default function MarketScreen() {
  const [mode, setMode] = useState<'home' | 'search' | 'brand' | 'coupon'>(
    'home',
  );

  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      {mode === 'home' && (
        <MarketHome
          onSearch={() => setMode('search')}
          onBrandSelect={(brand) => {
            setSelectedBrand(brand);
            setMode('brand');
          }}
          onCouponSelect={(coupon) => {
            setSelectedCoupon(coupon);
            setMode('coupon');
          }}
        />
      )}

      {mode === 'search' && (
        <MarketSearch
          onBack={() => setMode('home')}
          onSelectCoupon={(coupon) => {
            setSelectedCoupon(coupon);
            setMode('coupon');
          }}
        />
      )}

      {mode === 'brand' && (
        <BrandDetail
          brand={selectedBrand}
          onBack={() => setMode('home')}
          onSelectCoupon={(coupon) => {
            setSelectedCoupon(coupon);
            setMode('coupon');
          }}
        />
      )}

      {mode === 'coupon' && (
        <CouponDetail coupon={selectedCoupon} onBack={() => setMode('home')} />
      )}

      <BottomTabBar />
    </SafeAreaView>
  );
}

/* --------------------------------------------------------
   Header
-------------------------------------------------------- */
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

/* --------------------------------------------------------
   Home 화면
-------------------------------------------------------- */
function MarketHome({
  onSearch,
  onBrandSelect,
  onCouponSelect,
}: {
  onSearch: () => void;
  onBrandSelect: (b: any) => void;
  onCouponSelect: (c: any) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.inactiveTab}
          onPress={() => router.navigate('/(tabs)/reward')}
        >
          <Text style={styles.inactiveTabText}>리워드</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.activeTab}>
          <Text style={styles.activeTabText}>마켓</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 */}
      <TouchableOpacity style={styles.searchBox} onPress={onSearch}>
        <Image
          source={require('../../assets/main_icon/search.png')}
          style={styles.searchIcon}
        />
        <Text style={styles.searchText}>검색</Text>
      </TouchableOpacity>

      {/* 브랜드 콘 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>브랜드 콘</Text>
      </View>

      <View style={styles.brandCategory}>
        {[
          { name: 'LG전자', image: require('../../assets/main_icon/LG.png') },
          {
            name: 'LG생활건강',
            image: require('../../assets/main_icon/star.png'),
          },
          { name: '카페', image: require('../../assets/main_icon/coffee.png') },
          { name: '편의점', image: require('../../assets/main_icon/conv.png') },
        ].map((brand) => (
          <TouchableOpacity
            key={brand.name}
            style={styles.brandItem}
            onPress={() => onBrandSelect(brand)}
          >
            <Image source={brand.image} style={styles.brandImage} />
            <Text style={styles.brandText}>{brand.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 추천 쿠폰 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>추천 할인 쿠폰</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.couponList}
      >
        {[
          {
            point: '170,000 P',
            desc: 'LG 힐링미 오브제컬렉션 안마의자 10% 할인 쿠폰',
            image: require('../../assets/main_icon/chair.png'),
          },
          {
            point: '130,000 P',
            desc: 'LG 퓨리케어 정수기 5% 할인 쿠폰',
            image: require('../../assets/main_icon/puricare.png'),
          },
          {
            point: '50,000 P',
            desc: 'LG 휘센 AI 오브제컬렉션 3% 할인쿠폰',
            image: require('../../assets/main_icon/aircon.png'),
          },
        ].map((coupon) => (
          <TouchableOpacity
            key={coupon.desc}
            style={styles.couponCard}
            onPress={() => onCouponSelect(coupon)}
          >
            <Image source={coupon.image} style={styles.couponImage} />
            <Text style={styles.couponPoint}>{coupon.point}</Text>
            <Text style={styles.couponDesc}>{coupon.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

/* --------------------------------------------------------
   Search 화면
-------------------------------------------------------- */
function MarketSearch({
  onBack,
  onSelectCoupon,
}: {
  onBack: () => void;
  onSelectCoupon: (c: any) => void;
}) {
  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={{ fontSize: 16 }}>← 뒤로가기</Text>
      </TouchableOpacity>

      <TextInput
        style={{
          height: 45,
          borderRadius: 8,
          backgroundColor: '#F6F6F6',
          paddingHorizontal: 12,
          marginTop: 20,
        }}
        placeholder="검색어 입력"
      />

      <View style={{ marginTop: 30 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>추천 검색어</Text>

        <TouchableOpacity
          onPress={() =>
            onSelectCoupon({
              point: '50,000 P',
              desc: 'LG 휘센 AI 오브제컬렉션 3% 쿠폰',
              image: require('../../assets/main_icon/aircon.png'),
            })
          }
        >
          <Text
            style={{
              fontSize: 16,
              paddingVertical: 8,
              marginBottom: 323,
            }}
          >
            에어컨
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* --------------------------------------------------------
   브랜드 상세
-------------------------------------------------------- */
function BrandDetail({
  brand,
  onBack,
  onSelectCoupon,
}: {
  brand: any;
  onBack: () => void;
  onSelectCoupon: (c: any) => void;
}) {
  if (!brand) return null;
  const coupons = brandCoupons[brand.name] ?? [];

  return (
    <ScrollView style={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={{ fontSize: 16 }}>← 뒤로가기</Text>
      </TouchableOpacity>

      <Image
        source={brand.image}
        style={{
          width: 120,
          height: 120,
          alignSelf: 'center',
          marginTop: 20,
        }}
      />

      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          textAlign: 'center',
          marginTop: 10,
        }}
      >
        {brand.name}
      </Text>

      <Text style={{ marginTop: 30, fontSize: 18, fontWeight: '600' }}>
        브랜드 인기 쿠폰
      </Text>

      {coupons.length === 0 && (
        <Text style={{ marginTop: 10, color: '#999' }}>
          준비 중인 쿠폰입니다.
        </Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 10,
          paddingRight: 10,
        }}
      >
        {coupons.map((coupon, index) => (
          <TouchableOpacity
            key={`${coupon.desc}-${index}`}
            style={{
              width: 160,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 12,
              marginRight: 1,
              marginTop: 20,
            }}
            onPress={() => onSelectCoupon(coupon)}
          >
            <Image
              source={coupon.image}
              style={{
                width: 140,
                height: 140,
                borderRadius: 8,
                resizeMode: 'cover',
                marginBottom: 10,
              }}
            />
            <Text style={{ fontSize: 15, color: '#0D141C', fontWeight: '600' }}>
              {coupon.point}
            </Text>
            <Text style={{ fontSize: 13, color: '#A0A0A0' }}>
              {coupon.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

/* --------------------------------------------------------
   쿠폰 상세
-------------------------------------------------------- */
function CouponDetail({ coupon, onBack }: { coupon: any; onBack: () => void }) {
  const {
    myPoint,
    familyTotal,
    spendPoint,
    spendFamilyPoint,
    addMyHistory,
    addFamilyHistory,
  } = useRewardStore();

  if (!coupon) return null;

  const amount = Number(coupon.point.replace(/[^0-9]/g, ''));
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  // 가족 리워드 사용 판정 조건
  const isFamilyCoupon =
    coupon.desc.includes('퓨리케어') ||
    coupon.desc.includes('오브제') ||
    coupon.desc.includes('가전') ||
    coupon.desc.includes('전자');

  const handleUseCoupon = () => {
    if (isFamilyCoupon) {
      if (familyTotal < amount) {
        alert('가족 리워드가 부족합니다!');
        return;
      }

      spendFamilyPoint(amount);

      addFamilyHistory({
        id: Date.now(),
        date: today,
        label: coupon.desc,
        point: -amount,
        type: 'use',
      });
    } else {
      if (myPoint < amount) {
        alert('내 리워드가 부족합니다!');
        return;
      }

      spendPoint(amount);

      addMyHistory({
        id: Date.now(),
        date: today,
        label: coupon.desc,
        point: -amount,
        type: 'use',
      });
    }

    alert('쿠폰을 성공적으로 구매했습니다!');
    onBack();
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={{ fontSize: 16 }}>← 뒤로가기</Text>
      </TouchableOpacity>

      <Image
        source={coupon.image}
        style={{
          width: '100%',
          height: 260,
          resizeMode: 'contain',
          marginTop: 20,
        }}
      />

      <Text style={{ fontSize: 26, fontWeight: '700', marginTop: 20 }}>
        {coupon.point}
      </Text>

      <Text style={{ fontSize: 16, color: '#555', marginTop: 10 }}>
        {coupon.desc}
      </Text>

      <TouchableOpacity
        style={{
          height: 50,
          backgroundColor: '#353535',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
          marginTop: 40,
        }}
        onPress={handleUseCoupon}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
          {isFamilyCoupon ? '가족 리워드로 구매하기' : '개인 리워드로 구매하기'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* --------------------------------------------------------
   Bottom Tab Bar
-------------------------------------------------------- */
function BottomTabBar() {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/')}>
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

      <TouchableOpacity activeOpacity={0.7}>
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

/* --------------------------------------------------------
   Styles
-------------------------------------------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { alignItems: 'center', paddingBottom: 120 },

  header: {
    width: '100%',
    height: 53,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: { fontFamily: 'Agbalumo', fontSize: 20, color: '#353535' },
  settingButton: { position: 'absolute', right: 14, top: 15 },
  settingIcon: { width: 24, height: 24, tintColor: '#353535' },
  line1: {
    position: 'absolute',
    bottom: 0,
    height: 1,
    width: '100%',
    backgroundColor: '#E0E0E0',
  },

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
  searchIcon: { width: 18, height: 18, tintColor: '#A3A3A3', marginRight: 10 },
  searchText: { fontSize: 16, color: '#A3A3A3', fontFamily: 'Roboto-Regular' },

  sectionHeader: { width: '90%', marginTop: 25 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#353535',
    fontFamily: 'Roboto-SemiBold',
    marginBottom: 5,
  },

  brandCategory: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 3,
  },
  brandItem: { alignItems: 'center', justifyContent: 'center' },
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
  },

  couponList: { flexDirection: 'row', paddingHorizontal: 10, left: 8 },
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
  couponPoint: { fontSize: 15, color: '#0D141C', fontWeight: '600' },
  couponDesc: { fontSize: 13, color: '#A0A0A0' },

  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 75,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  tabIcon: { width: 50, height: 50 },
});
