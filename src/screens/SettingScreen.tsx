// src/screens/Setting.tsx
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

/* ────────────── Header ────────────── */
function Header() {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
      >
        <Image
          source={require('../../assets/bars/close.png')}
          style={styles.closeIcon}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>설정</Text>
      <View style={styles.line} />
    </View>
  );
}

/* ────────────── Profile Section ────────────── */
function ProfileSection() {
  return (
    <View style={styles.profile}>
      <Image
        source={require('../../assets/main_icon/jinjin.png')}
        style={styles.profileImage}
      />
      <View style={styles.textBox}>
        <Text style={styles.nameText}>진진이(누나)</Text>
        <Text style={styles.emailText}>jinijini@gmail.com</Text>
      </View>
      <Image
        source={require('../../assets/bars/right.png')}
        style={styles.detailIcon}
      />
    </View>
  );
}

/* ────────────── Setting List ────────────── */
function SettingList() {
  const items = [
    { icon: require('../../assets/main_icon/1.png'), label: '가족 초대 관리' },
    { icon: require('../../assets/main_icon/2.png'), label: '가전 연동 관리' },
    { icon: require('../../assets/main_icon/3.png'), label: '알림 설정' },
    {
      icon: require('../../assets/main_icon/4.png'),
      label: '언어',
      sub: '한국어',
    },
    {
      icon: require('../../assets/main_icon/5.png'),
      label: '버전 정보',
      sub: '1.0.0',
    },
    {
      icon: require('../../assets/main_icon/6.png'),
      label: '개인정보 처리 방침',
    },
  ];

  return (
    <View style={styles.settingList}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.listItem}>
          {/* 왼쪽 아이콘 + 라벨 */}
          <View style={styles.listLeft}>
            <Image source={item.icon} style={styles.listIcon} />
            <Text style={styles.listText}>{item.label}</Text>
          </View>

          {/* 오른쪽 서브 텍스트 or 화살표 */}
          {item.sub ? (
            <Text style={styles.subText}>{item.sub}</Text>
          ) : (
            <Image
              source={require('../../assets/bars/right.png')}
              style={styles.detailIcon}
            />
          )}
        </View>
      ))}
    </View>
  );
}

/* ────────────── Logout Button ────────────── */
function LogoutButton() {
  return (
    <TouchableOpacity style={styles.logoutButton}>
      <Text style={styles.logoutText}>로그아웃</Text>
    </TouchableOpacity>
  );
}

/* ────────────── Setting Screen ────────────── */
export default function Setting() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />
        <ProfileSection />
        <SettingList />
        <LogoutButton />
      </ScrollView>
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

  // Header
  header: {
    height: 59,
    marginTop: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeButton: { position: 'absolute', left: 16, top: 10 },
  closeIcon: { width: 41, height: 41, resizeMode: 'contain' },
  headerTitle: {
    fontFamily: 'Roboto-Bold',
    fontWeight: '600',
    fontSize: 18,
    color: '#353535',
  },
  line: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
  },

  // 프로필
  profile: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 24,
  },
  profileImage: { width: 56, height: 56, borderRadius: 28 },
  textBox: { flex: 1, marginLeft: 12 },
  nameText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: '500',
    color: '#121417',
  },
  emailText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: '#61758A',
    marginTop: 2,
  },
  detailIcon: {
    width: 7,
    height: 14,
    tintColor: '#8E8E93',
    resizeMode: 'contain',
  },

  // 설정 리스트
  settingList: {
    marginTop: 9,
    width: '90%',
    alignSelf: 'center',
    gap: 1,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomColor: '#E0E0E0',
  },
  listLeft: { flexDirection: 'row', alignItems: 'center' },
  listIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 12,
  },
  listText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: '#121417',
  },
  subText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: '#61758A',
  },

  // 로그아웃 버튼
  logoutButton: {
    backgroundColor: '#353535',
    borderRadius: 8,
    paddingVertical: 12,
    width: '90%',
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 80,
  },
  logoutText: {
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
});
