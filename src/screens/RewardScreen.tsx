// src/screens/RewardScreen.tsx
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
  Modal,
  ImageBackground,
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

/* ────────────── Reward Content ────────────── */
function RewardContent() {
  const [isModalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* 탭 영역 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={styles.activeTab}>
          <Text style={styles.activeTabText}>리워드</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inactiveTab}
          onPress={() => navigation.navigate('Market')}
        >
          <Text style={styles.inactiveTabText}>마켓</Text>
        </TouchableOpacity>
      </View>

      {/* 나의 리워드 박스 */}
      <View style={styles.myRewardBox}>
        <Text style={styles.sectionTitle}>나의 리워드</Text>

        <View style={styles.pointRow}>
          <Text style={styles.pointText}>13,780 P</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Image
              source={require('../../assets/bars/right.png')}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.line} />

        <View style={styles.info}>
          <View style={styles.bottomRow}>
            <Image
              source={require('../../assets/main_icon/Add_1.png')}
              style={styles.plusIcon}
            />
            <Text style={styles.subText}>
              진행 중인 챌린지로 <Text style={{ fontWeight: '600' }}>130P</Text>{' '}
              더 모을 수 있어요!
            </Text>
          </View>
        </View>
      </View>

      {/* ────────────── 리워드 상세 모달 ────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Image
                source={require('../../assets/bars/close_2.png')}
                style={styles.modalCloseIcon}
              />
            </TouchableOpacity>

            {/* 나의 리워드 정보 */}
            <View style={styles.myRewardBox}>
              <Text style={styles.sectionTitle}>나의 리워드</Text>

              <View style={styles.pointRow}>
                <Text style={styles.pointText}>13,780 P</Text>
                <Image
                  source={require('../../assets/bars/jin.png')}
                  style={styles.modalCharacter}
                />
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <Image
                    source={require('../../assets/bars/right.png')}
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.line} />

              <View style={styles.info}>
                <View style={styles.bottomRow}>
                  <Image
                    source={require('../../assets/main_icon/Add_1.png')}
                    style={styles.plusIcon}
                  />
                  <Text style={styles.subText}>
                    진행 중인 챌린지로{' '}
                    <Text style={{ fontWeight: '600' }}>130P</Text> 더 모을 수
                    있어요!
                  </Text>
                </View>
              </View>
            </View>

            {/* 포인트 내역 (곡선 경로 + 말풍선) */}
            <ImageBackground
              source={require('../../assets/bars/4.png')}
              style={styles.pathBackground}
              imageStyle={{ resizeMode: 'contain' }}
            >
              {/* 히스토리 버블 1 */}
              <ImageBackground
                source={require('../../assets/bars/Bubble_1.png')}
                style={[styles.historyBubble, { top: -15, left: 10 }]}
                imageStyle={{ resizeMode: 'stretch' }}
              >
                <Text style={styles.historyDate}>2025.10.26</Text>
                <Text style={styles.historyLabel}>러닝 3km</Text>
                <Text style={[styles.historyPoint, { color: '#EE7676' }]}>
                  +1,700p
                </Text>
              </ImageBackground>

              {/* 히스토리 버블 2 */}
              <ImageBackground
                source={require('../../assets/bars/Bubble_2.png')}
                style={[styles.historyBubble, { top: -15, left: 190 }]}
                imageStyle={{ resizeMode: 'stretch' }}
              >
                <Text style={styles.historyDate}>2025.10.28</Text>
                <Text style={styles.historyLabel}>포인트 상점</Text>
                <Text style={[styles.historyPoint, { color: '#5A6FE9' }]}>
                  -1,500p
                </Text>
              </ImageBackground>

              {/* 히스토리 버블 3 */}
              <ImageBackground
                source={require('../../assets/bars/Bubble_1.png')}
                style={[styles.historyBubble, { top: 110, left: 90 }]}
                imageStyle={{ resizeMode: 'stretch' }}
              >
                <Text style={styles.historyDate}>2025.10.29</Text>
                <Text style={styles.historyLabel}>릴레이 세탁기</Text>
                <Text style={[styles.historyPoint, { color: '#EE7676' }]}>
                  +300p
                </Text>
              </ImageBackground>

              {/* 경로 노드 */}
              <Image
                source={require('../../assets/bars/1.png')}
                style={[styles.nodeImage, { top: 60, left: 102 }]}
              />
              <Image
                source={require('../../assets/bars/3.png')}
                style={[styles.nodeImage, { top: 60, left: 248 }]}
              />
              <Image
                source={require('../../assets/bars/1.png')}
                style={[styles.nodeImage, { top: 185, left: 182 }]}
              />
              <Image
                source={require('../../assets/bars/2.png')}
                style={[styles.nodeImage, { top: 185, left: 20 }]}
              />
              <Image
                source={require('../../assets/bars/2.png')}
                style={[styles.nodeImage, { top: 260, left: 100 }]}
              />
              <Image
                source={require('../../assets/bars/2.png')}
                style={[styles.nodeImage, { top: 260, left: 230 }]}
              />
            </ImageBackground>
          </View>
        </View>
      </Modal>

      {/* 가족 리워드 박스 */}
      <View style={styles.familyRewardBox}>
        <Text style={styles.sectionTitle}>우리 가족 리워드</Text>
        <Text style={styles.familyPointText}>130,000 P</Text>

        {/* 누적 포인트 진행 바 */}
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressSegment, { backgroundColor: '#EADBC8' }]}
          />
          <View
            style={[styles.progressSegment, { backgroundColor: '#F7E8D0' }]}
          />
          <View
            style={[styles.progressSegment, { backgroundColor: '#F3DCC7' }]}
          />
        </View>

        <View style={styles.line} />

        {/* 주간 랭킹 */}
        <View style={styles.info_1}>
          <View style={styles.rankingHeader}>
            <Image
              source={require('../../assets/main_icon/Add_1.png')}
              style={styles.plusIcon}
            />
            <Text style={styles.rankingTitle}>10월 3째주 주간 랭킹</Text>
            <Text style={styles.weekText}>week | month</Text>
          </View>
        </View>

        {/* 랭킹 리스트 */}
        <View style={styles.info_2}>
          <View style={styles.rankingList}>
            {[
              { rank: 1, name: '엄마', point: '+1,000p' },
              { rank: 2, name: '동생', point: '+570p' },
              { rank: 3, name: '아빠', point: '+330p' },
              { rank: 4, name: '나', point: '+100p' },
            ].map((item) => (
              <View key={item.rank} style={styles.rankRow}>
                <Text style={styles.rankNumber}>{item.rank}</Text>
                <Text style={styles.rankName}>{item.name}</Text>
                <Text style={styles.rankPoint}>{item.point}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* ────────────── Bottom Tab Bar ────────────── */
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

/* ────────────── Reward Screen ────────────── */
export default function RewardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <RewardContent />
      <BottomTabBar />
    </SafeAreaView>
  );
}

/* ────────────── Styles ────────────── */
const styles = StyleSheet.create({
  // 기본 구조
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { alignItems: 'center', paddingBottom: 120 },
  subText: { fontSize: 13, color: '#000' },

  // Header
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
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

  // 나의 리워드 박스
  myRewardBox: {
    width: 330,
    height: 173,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: { fontSize: 13, color: '#000', fontFamily: 'Roboto' },
  pointRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  pointText: {
    fontSize: 32,
    color: '#000',
    fontWeight: '600',
    left: 20,
    marginTop: 10,
    fontFamily: 'Roboto',
  },
  arrowIcon: { width: 8, height: 12, marginLeft: 35, marginTop: 15 },
  line: {
    width: '95%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
    alignSelf: 'center',
    marginTop: 20,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center' },
  plusIcon: { width: 20, height: 20, marginRight: 8 },
  info: {
    width: 300,
    height: 34,
    backgroundColor: '#ECECEC',
    borderRadius: 10,
    padding: 8,
    marginTop: 5,
    alignSelf: 'center',
    justifyContent: 'center',
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    height: 600,

    alignItems: 'center',
  },
  modalCloseButton: { position: 'absolute', marginTop: 15 },
  modalCloseIcon: { width: 22, height: 8, tintColor: '#A0A0A0' },
  modalCharacter: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 162,
    height: 90,
    resizeMode: 'contain',
  },
  pathBackground: {
    width: 330,
    height: 350,
    alignSelf: 'center',
    marginTop: 40,
    position: 'relative',
  },
  historyBubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    width: 135,
    height: 68,
    paddingHorizontal: 16,
  },
  historyDate: {
    color: '#fff',
    fontSize: 11,
    width: 70,
    marginTop: -35,
    left: -4,
    fontFamily: 'Roboto',
  },
  historyLabel: {
    color: '#fff',
    fontSize: 13,
    marginLeft: -75,
    marginTop: 6,
    fontFamily: 'Roboto',
  },
  historyPoint: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 7,
    marginLeft: 7,
    fontFamily: 'Roboto',
  },
  nodeImage: {
    position: 'absolute',
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },

  // 가족 리워드
  familyRewardBox: {
    width: 330,
    height: 325,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  familyPointText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    left: 20,
    marginTop: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    width: 270,
    height: 13,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    alignSelf: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  progressSegment: { flex: 1 },
  info_1: {
    width: 300,
    height: 34,
    backgroundColor: '#ECECEC',
    borderRadius: 10,
    padding: 8,
    marginTop: 7,
    alignSelf: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  rankingHeader: { flexDirection: 'row', alignItems: 'center' },
  rankingTitle: { fontSize: 13, color: '#000' },
  weekText: { marginLeft: 'auto', fontSize: 13, color: '#A0A0A0' },
  info_2: {
    width: 300,
    height: 141,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginTop: -15,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  rankingList: { marginTop: 13 },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    alignItems: 'center',
  },
  rankNumber: {
    width: 20,
    textAlign: 'center',
    fontSize: 15,
    color: '#000',
    fontFamily: 'Roboto-Medium',
  },
  rankName: {
    flex: 1,
    fontSize: 12,
    left: 20,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Roboto-Medium',
  },
  rankPoint: {
    width: 70,
    color: '#FF4D4F',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Roboto-Medium',
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
