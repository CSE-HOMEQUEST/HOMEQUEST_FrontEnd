// src/screens/Setting.tsx
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  Share,
} from 'react-native';

import { useAuthStore } from '@/src/store/useAuthStore';

/* ────────────── 가족 초대 팝업 ────────────── */
function FamilyInvitePopup({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const inviteCode = 'WG371518';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('복사 완료', '초대 코드가 복사되었습니다.');
  };

  const handleShare = async () => {
    await Share.share({
      message: `우리 가족 초대코드: ${inviteCode}\nHomeQuest에서 가족과 연결해요!`,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={popupStyles.overlay}>
        <View style={popupStyles.box}>
          <Text style={popupStyles.title}>가족 초대 코드</Text>
          <Text style={popupStyles.code}>{inviteCode}</Text>

          <View style={popupStyles.buttons}>
            <TouchableOpacity style={popupStyles.button} onPress={handleCopy}>
              <Text style={popupStyles.buttonText}>복사</Text>
            </TouchableOpacity>

            <TouchableOpacity style={popupStyles.button} onPress={handleShare}>
              <Text style={popupStyles.buttonText}>공유</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={popupStyles.close} onPress={onClose}>
            <Text style={{ fontSize: 14, color: '#666' }}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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

/* ────────────── 프로필 섹션 ────────────── */
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

/* ────────────── 설정 항목 리스트 ────────────── */
function SettingList({ onInvitePress }: { onInvitePress: () => void }) {
  const items = [
    {
      icon: require('../../assets/main_icon/1.png'),
      label: '가족 초대 관리',
      action: onInvitePress,
    },
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
        <TouchableOpacity
          key={idx}
          style={styles.listItem}
          activeOpacity={0.7}
          onPress={item.action}
        >
          <View style={styles.listLeft}>
            <Image source={item.icon} style={styles.listIcon} />
            <Text style={styles.listText}>{item.label}</Text>
          </View>

          {item.sub ? (
            <Text style={styles.subText}>{item.sub}</Text>
          ) : (
            <Image
              source={require('../../assets/bars/right.png')}
              style={styles.detailIcon}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ────────────── 로그아웃 버튼 ────────────── */
function LogoutButton() {
  const { logout, isLoading } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } finally {
            router.replace('/login');
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.logoutButton, isLoading && { opacity: 0.6 }]}
      disabled={isLoading}
      onPress={handleLogout}
    >
      <Text style={styles.logoutText}>
        {isLoading ? '로그아웃 중...' : '로그아웃'}
      </Text>
    </TouchableOpacity>
  );
}

/* ────────────── 설정 화면 ────────────── */
export default function Setting() {
  const [inviteVisible, setInviteVisible] = React.useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />
        <ProfileSection />
        <SettingList onInvitePress={() => setInviteVisible(true)} />
        <LogoutButton />
      </ScrollView>

      {/* 가족 초대 팝업 */}
      <FamilyInvitePopup
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
      />
    </SafeAreaView>
  );
}

/* ────────────── 스타일 ────────────── */
const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  box: {
    width: 300,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  code: { fontSize: 28, fontWeight: '700', letterSpacing: 2, marginBottom: 24 },
  buttons: { flexDirection: 'row', gap: 12 },
  button: {
    backgroundColor: '#5A6FE9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 14 },
  close: { marginTop: 16 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  /* 헤더 */
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

  /* 프로필 */
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
  nameText: { fontSize: 16, fontWeight: '500', color: '#121417' },
  emailText: { fontSize: 14, color: '#61758A', marginTop: 2 },
  detailIcon: {
    width: 7,
    height: 14,
    tintColor: '#8E8E93',
    resizeMode: 'contain',
  },

  /* 설정 리스트 */
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
  listText: { fontSize: 16, color: '#121417' },
  subText: { fontSize: 16, color: '#61758A' },

  /* 로그아웃 버튼 */
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
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
});
