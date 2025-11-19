import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';

import {
  useRewardStore,
  HistoryItem,
  WeeklyRankItem,
} from '../store/useRewardStore';

import { useChallengeStore } from '@/src/store/useChallengeStore';

/* --------------------------------------------------
   MOCK API (실제 API 연결 시 이 부분 교체)
-------------------------------------------------- */
const mockApi = {
  // 나의 리워드
  getMyReward: async (): Promise<{
    currentPoint: number;
    expectedPoint: number;
  }> => {
    return new Promise((res) =>
      setTimeout(() => res({ currentPoint: 13780, expectedPoint: 130 }), 400),
    );
  },

  // 개인 히스토리
  getHistory: async (): Promise<HistoryItem[]> => {
    return new Promise((res) =>
      setTimeout(
        () =>
          res([
            {
              id: 1,
              date: '2025.10.26',
              label: '개인 챌린지 : 러닝 3km',
              point: 10,
              type: 'earn',
            },
            {
              id: 2,
              date: '2025.10.28',
              label: 'LG 베스트샵 1만원 상품권',
              point: -10000,
              type: 'use',
            },
          ]),
        450,
      ),
    );
  },

  // 가족 히스토리
  getFamilyHistory: async (): Promise<HistoryItem[]> => {
    return new Promise((res) =>
      setTimeout(
        () =>
          res([
            {
              id: 100,
              date: '2025.10.25',
              label: '돌아가며 청소기 돌리기',
              point: 50,
              type: 'earn',
            },
            {
              id: 101,
              date: '2025.10.27',
              label: 'LG 퓨리케어 정수기 5% 할인 쿠폰',
              point: -130000,
              type: 'use',
            },
          ]),
        450,
      ),
    );
  },

  // 가족 리워드 및 랭킹
  getFamilyReward: async (): Promise<{
    total: number;
    memberTotal: { name: string; point: number }[];
    weeklyRank: WeeklyRankItem[];
    monthlyRank: WeeklyRankItem[];
  }> => {
    return new Promise((res) =>
      setTimeout(
        () =>
          res({
            total: 130000,
            memberTotal: [
              { name: '엄마', point: 81200 },
              { name: '아빠', point: 26000 },
              { name: '동생', point: 15800 },
              { name: '나', point: 7100 },
            ],
            weeklyRank: [
              { rank: 1, name: '엄마', point: 1000 },
              { rank: 2, name: '동생', point: 570 },
              { rank: 3, name: '아빠', point: 330 },
              { rank: 4, name: '나', point: 100 },
            ],
            monthlyRank: [
              { rank: 1, name: '엄마', point: 3100 },
              { rank: 2, name: '아빠', point: 2100 },
              { rank: 3, name: '동생', point: 1500 },
              { rank: 4, name: '나', point: 820 },
            ],
          }),
        380,
      ),
    );
  },
};

/* --------------------------------------------------
   Header
-------------------------------------------------- */
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

/* --------------------------------------------------
   텍스트 자동 스크롤 컴포넌트
-------------------------------------------------- */
function ScrollingLabel({ text }: { text: string }) {
  const scrollX = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -150,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [scrollX]);

  return (
    <View style={{ width: 110, height: 16, overflow: 'hidden' }}>
      <Animated.Text
        numberOfLines={1}
        style={{
          fontSize: 13,
          lineHeight: 16,
          color: '#fff',
          transform: [{ translateX: scrollX }],
          width: '200%',
        }}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

/* --------------------------------------------------
   말풍선 컴포넌트 (타임라인 히스토리)
-------------------------------------------------- */
function HistoryBubble({
  item,
  bubbleImg,
  position,
}: {
  item: HistoryItem;
  bubbleImg: any;
  position: any;
}) {
  return (
    <ImageBackground
      source={bubbleImg}
      style={[styles.historyBubble, position]}
      imageStyle={{ resizeMode: 'stretch' }}
    >
      {/* 날짜 */}
      <Text style={styles.historyDate}>{item.date}</Text>

      {/* 내용 스크롤 */}
      <View style={{ position: 'absolute', top: 20, left: 12, width: 140 }}>
        <ScrollingLabel text={item.label} />
      </View>

      {/* 포인트 표시 */}
      <Text
        style={[
          styles.historyPoint,
          { color: item.point > 0 ? '#EE7676' : '#5A6FE9' },
        ]}
      >
        {item.point > 0 ? `+${item.point}p` : `${item.point}p`}
      </Text>
    </ImageBackground>
  );
}

/* --------------------------------------------------
   Reward Content (메인 로직)
-------------------------------------------------- */
function RewardContent() {
  const { ongoing } = useChallengeStore();

  const [isModalVisible, setModalVisible] = useState(false);
  const [isFamilyModalVisible, setFamilyModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rankMode, setRankMode] = useState<'week' | 'month'>('week');

  // 리워드 스토어 값들
  const {
    myPoint,
    familyTotal,
    weeklyRank,
    monthlyRank,
    myHistory,
    familyHistory,
    setMyReward,
    setFamilyReward,
    memberTotal,
    setMemberTotal,
    loading,
    setLoading,
  } = useRewardStore();

  // 진행 중 챌린지 포인트 합계
  const ChallengeExpectedPoint = ongoing.reduce((sum, ch) => {
    return sum + (ch.rewardPoints ?? 0);
  }, 0);

  /* ------------------------------------------
      타임라인 노드 위치 (고정 레이아웃)
  ------------------------------------------ */
  const nodePositions = [
    { top: 57, left: 102 },
    { top: 57, left: 248 },
    { top: 183, left: 182 },
    { top: 183, left: 20 },
    { top: 260, left: 100 },
    { top: 260, left: 230 },
  ];

  /* ------------------------------------------
      개인 타임라인 최근 3개 히스토리
  ------------------------------------------ */
  const bubbleItems = myHistory.slice(-3);
  const NODES = 6;
  const nodes = Array(NODES).fill(null);

  bubbleItems.forEach((item, idx) => {
    if (idx < NODES) nodes[idx] = item;
  });

  /* ------------------------------------------
      가족 타임라인 최근 3개 히스토리
  ------------------------------------------ */
  const familyBubbleItems = familyHistory.slice(-3);
  const FAMILY_NODES = 6;
  const familyNodes = Array(FAMILY_NODES).fill(null);

  familyBubbleItems.forEach((item, idx) => {
    if (idx < FAMILY_NODES) familyNodes[idx] = item;
  });

  /* ------------------------------------------
      노드 이미지 선택
  ------------------------------------------ */
  function getNodeImage(item: any) {
    if (!item) return require('../../assets/bars/2.png'); // 기본
    if (item.type === 'earn') return require('../../assets/bars/1.png');
    return require('../../assets/bars/3.png');
  }

  /* ------------------------------------------
      리워드 + 가족 리워드 불러오기
  ------------------------------------------ */
  const loadRewardData = useCallback(async () => {
    try {
      setLoading(true);
      const [my, family] = await Promise.all([
        mockApi.getMyReward(),
        mockApi.getFamilyReward(),
      ]);

      setMyReward(my);
      setFamilyReward(family);
      setMemberTotal(family.memberTotal);
    } catch (e) {
      console.log('Reward load error:', e);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setMyReward, setMemberTotal, setFamilyReward]);

  /* ------------------------------------------
      개인 + 가족 히스토리 불러오기
  ------------------------------------------ */
  const loadHistory = useCallback(async () => {
    try {
      const [my, family] = await Promise.all([
        mockApi.getHistory(),
        mockApi.getFamilyHistory(),
      ]);

      useRewardStore.getState().setHistory('my', my);
      useRewardStore.getState().setHistory('family', family);
    } catch (e) {
      console.log('History load error:', e);
    }
  }, []);

  /* ------------------------------------------
      화면 최초 진입 시 데이터 로드
  ------------------------------------------ */
  useEffect(() => {
    loadRewardData();
    loadHistory();
  }, [loadRewardData, loadHistory]);

  /* ------------------------------------------
      Pull to Refresh
  ------------------------------------------ */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRewardData();
    await loadHistory();
    setRefreshing(false);
  }, [loadRewardData, loadHistory]);

  /* ------------------------------------------
      모달 열기
  ------------------------------------------ */
  const openModal = () => {
    setModalVisible(true);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ------------------------------------------
          탭 (리워드 / 마켓)
      ------------------------------------------ */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={styles.activeTab}>
          <Text style={styles.activeTabText}>리워드</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inactiveTab}
          onPress={() => router.navigate('/(tabs)/market')}
        >
          <Text style={styles.inactiveTabText}>마켓</Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------
          나의 리워드 박스
      ------------------------------------------ */}
      <View style={styles.myRewardBox}>
        <Text style={styles.sectionTitle}>나의 리워드</Text>

        <View style={styles.pointRow}>
          <Text style={styles.pointText}>
            {loading ? '...' : `${myPoint.toLocaleString()} P`}
          </Text>

          <TouchableOpacity onPress={openModal}>
            <Image
              source={require('../../assets/bars/right.png')}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.line} />

        {/* 진행 중 챌린지 정보 */}
        <View style={styles.info}>
          <View style={styles.bottomRow}>
            <Image
              source={require('../../assets/main_icon/Add_1.png')}
              style={styles.plusIcon}
            />
            <Text style={styles.subText}>
              진행 중인 챌린지로{' '}
              <Text style={{ fontWeight: '600' }}>
                {ChallengeExpectedPoint.toLocaleString()}P
              </Text>{' '}
              더 모을 수 있어요!
            </Text>
          </View>
        </View>
      </View>

      {/* ------------------------------------------
          개인 리워드 모달
      ------------------------------------------ */}
      <Modal animationType="slide" transparent visible={isModalVisible}>
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

            {/* 모달 상단 리워드 정보 */}
            <View style={styles.myRewardBox}>
              <Text style={styles.sectionTitle}>나의 리워드</Text>

              <View style={styles.pointRow}>
                <Text style={styles.pointText}>
                  {myPoint.toLocaleString()} P
                </Text>
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
                    <Text style={{ fontWeight: '600' }}>
                      {ChallengeExpectedPoint.toLocaleString()}P
                    </Text>{' '}
                    더 모을 수 있어요!
                  </Text>
                </View>
              </View>
            </View>

            {/* ------------------------------------------
                개인 히스토리 최근 3개 타임라인
            ------------------------------------------ */}
            <View style={styles.timelineContainer}>
              {/* 길 background */}
              <Image
                source={require('../../assets/bars/4.png')}
                style={styles.timelinePath}
                resizeMode="stretch"
              />

              {/* 말풍선 구성 */}
              {bubbleItems.map((item, index) => {
                const pos = [
                  { top: -15, left: 10 },
                  { top: -15, left: 190 },
                  { top: 110, left: 90 },
                ];

                const bubbleImages = [
                  require('../../assets/bars/Bubble_1.png'),
                  require('../../assets/bars/Bubble_2.png'),
                  require('../../assets/bars/Bubble_1.png'),
                ];

                return (
                  <HistoryBubble
                    key={item.id}
                    item={item}
                    bubbleImg={bubbleImages[index]}
                    position={pos[index]}
                  />
                );
              })}

              {/* 노드 아이콘 */}
              {nodePositions.map((pos, index) => (
                <Image
                  key={index}
                  source={getNodeImage(nodes[index])}
                  style={[styles.nodeImage, pos]}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------
          가족 리워드 박스
      ------------------------------------------ */}
      <View style={styles.familyRewardBox}>
        <Text style={styles.sectionTitle}>우리 가족 리워드</Text>

        <View style={styles.pointRow}>
          <Text style={styles.familyPointText}>
            {loading ? '...' : `${familyTotal.toLocaleString()} P`}
          </Text>

          <TouchableOpacity onPress={() => setFamilyModalVisible(true)}>
            <Image
              source={require('../../assets/bars/right.png')}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------
            가족 리워드 모달
        ------------------------------------------ */}
        <Modal animationType="slide" transparent visible={isFamilyModalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              {/* 닫기 버튼 */}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setFamilyModalVisible(false)}
              >
                <Image
                  source={require('../../assets/bars/close_2.png')}
                  style={styles.modalCloseIcon}
                />
              </TouchableOpacity>

              {/* 모달 상단 - 가족 총 포인트 */}
              <View style={styles.myRewardBox}>
                <Text style={styles.sectionTitle}>우리 가족 리워드</Text>

                <View style={styles.pointRow}>
                  <Text style={styles.pointText}>
                    {familyTotal.toLocaleString()} P
                  </Text>
                </View>

                <View style={styles.line} />

                <View style={styles.info}>
                  <View style={styles.bottomRow}>
                    <Image
                      source={require('../../assets/main_icon/Add_1.png')}
                      style={styles.plusIcon}
                    />
                    <Text style={styles.subText}>
                      10월 3째주, 가족 챌린지로{' '}
                      <Text style={{ fontWeight: '600' }}>
                        {weeklyRank.reduce((sum, r) => sum + r.point, 0)}P
                      </Text>{' '}
                      모았어요!
                    </Text>
                  </View>
                </View>
              </View>

              {/* ------------------------------------------
                  가족 히스토리 타임라인 (개인과 동일 포맷)
              ------------------------------------------ */}
              <View style={styles.timelineContainer}>
                {/* 길 배경 */}
                <Image
                  source={require('../../assets/bars/4.png')}
                  style={styles.timelinePath}
                  resizeMode="stretch"
                />

                {/* 가족 말풍선 */}
                {familyBubbleItems.map((item, index) => {
                  const pos = [
                    { top: -15, left: 10 },
                    { top: -15, left: 190 },
                    { top: 110, left: 90 },
                  ];

                  const bubbleImages = [
                    require('../../assets/bars/Bubble_1.png'),
                    require('../../assets/bars/Bubble_2.png'),
                    require('../../assets/bars/Bubble_1.png'),
                  ];

                  return (
                    <HistoryBubble
                      key={item.id}
                      item={item}
                      bubbleImg={bubbleImages[index]}
                      position={pos[index]}
                    />
                  );
                })}

                {/* 노드 배치 */}
                {nodePositions.map((pos, index) => (
                  <Image
                    key={index}
                    source={getNodeImage(familyNodes[index])}
                    style={[styles.nodeImage, pos]}
                  />
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* ------------------------------------------
            가족 포인트 비율바
        ------------------------------------------ */}
        {(() => {
          const progressRates = memberTotal.map((m) =>
            familyTotal === 0 ? 0 : m.point / familyTotal,
          );

          return (
            <View style={styles.progressContainer}>
              {memberTotal.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    {
                      flex: progressRates[index],
                      backgroundColor: [
                        '#d68ba2ff',
                        '#9a9d6bff',
                        '#f4d9c0ff',
                        '#b9b4b3ff',
                      ][index % 4],
                    },
                  ]}
                />
              ))}
            </View>
          );
        })()}

        <View style={styles.line} />

        {/* ------------------------------------------
            주간 / 월간 랭킹 헤더
        ------------------------------------------ */}
        <View style={styles.info_1}>
          <View style={styles.rankingHeader}>
            <Image
              source={require('../../assets/main_icon/Add_1.png')}
              style={styles.plusIcon}
            />
            <Text style={styles.rankingTitle}>
              {rankMode === 'week' ? '10월 3째주 주간 랭킹' : '10월 월간 랭킹'}
            </Text>

            <View style={styles.weekTabRow}>
              <TouchableOpacity onPress={() => setRankMode('week')}>
                <Text
                  style={[
                    styles.weekTabText,
                    rankMode === 'week' && styles.weekTabActive,
                  ]}
                >
                  week
                </Text>
              </TouchableOpacity>

              <Text style={{ color: '#A0A0A0', marginHorizontal: 4 }}>|</Text>

              <TouchableOpacity onPress={() => setRankMode('month')}>
                <Text
                  style={[
                    styles.weekTabText,
                    rankMode === 'month' && styles.weekTabActive,
                  ]}
                >
                  month
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ------------------------------------------
            주/월 랭킹 리스트
        ------------------------------------------ */}
        <View style={styles.info_2}>
          <View style={styles.rankingList}>
            {(() => {
              const rankingData =
                rankMode === 'week' ? weeklyRank : monthlyRank;

              return rankingData.map((item) => (
                <View key={item.rank} style={styles.rankRow}>
                  <Text style={styles.rankNumber}>{item.rank}</Text>
                  <Text style={styles.rankName}>{item.name}</Text>
                  <Text
                    style={[
                      styles.rankPoint,
                      { color: item.point > 0 ? '#EE7676' : '#5A6FE9' },
                    ]}
                  >
                    {item.point > 0 ? `+${item.point}p` : `${item.point}p`}
                  </Text>
                </View>
              ));
            })()}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* --------------------------------------------------
   Bottom Tab Bar
-------------------------------------------------- */
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

/* --------------------------------------------------
   RewardScreen
-------------------------------------------------- */
export default function RewardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <RewardContent />
      <BottomTabBar />
    </SafeAreaView>
  );
}

/* --------------------------------------------------
   Styles
-------------------------------------------------- */
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

  // 타임라인
  timelineContainer: {
    width: 335,
    height: 300,
    alignSelf: 'center',
    marginTop: 40,
    position: 'relative',
  },
  timelinePath: {
    width: 335,
    height: 221,
    position: 'absolute',
    top: 65,
    left: 0,
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
  historyPoint: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 15,
    left: -18,
    width: 60,
    textAlign: 'right',
    fontFamily: 'Roboto',
  },
  nodeImage: {
    position: 'absolute',
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },

  // 가족 리워드 박스
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
    fontFamily: 'Roboto-Medium',
  },

  // 가족 기여도 바
  progressContainer: {
    flexDirection: 'row',
    width: 270,
    height: 13,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#525252ff',
  },
  progressSegment: { flex: 1 },

  // 가족 랭킹
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
    position: 'relative',
  },
  weekTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  weekTabText: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  weekTabActive: {
    color: '#353535',
    fontWeight: '600',
  },
  rankingHeader: { flexDirection: 'row', alignItems: 'center' },
  rankingTitle: { fontSize: 13, color: '#000' },

  info_2: {
    width: 300,
    height: 141,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginTop: -15,
    alignSelf: 'center',
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
    textAlign: 'center',
    color: '#000',
    fontFamily: 'Roboto-Medium',
  },
  rankPoint: {
    width: 70,
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
  tabIcon: { width: 50, height: 50 },
});
