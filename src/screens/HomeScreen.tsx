// src/screens/Home.tsx
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageStyle,
  Modal,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

// ───── AI 추천 응답 타입 ─────
type ChallengeInfo = {
  challengeId: string;
  category: string;
  mode?: string;
  freq?: number;
  durationType?: string;
  deviceType?: string;
  progressType?: string;
  adj_score?: number;
  score?: number;
};

type SpeedInfo = {
  challengeId: string;
  category: string;
  userId: string;
  notificationTime: string; // "17:00:00"
  weekday: number;
  freq: number;
  familyPoints: number;
  personalPoints: number;
  adj_score: number;
  score: number;
};

type TodayReportResponse = {
  userId: string;
  energyHigh?: boolean;
  main_auc?: number;
  speed_auc?: number;
  daily?: ChallengeInfo;
  monthly?: ChallengeInfo;
  speed?: SpeedInfo;
};

// challengeId → 화면에 보여줄 이름
function getChallengeName(challengeId: string) {
  switch (challengeId) {
    case 'daily_water_2':
      return '아침·저녁 물 두 잔 마시기';
    case 'monthly_heating':
      return '한 달간 난방 절약';
    case 'speed_dishwasher':
      return '저녁 식기세척기 릴레이';
    default:
      return challengeId;
  }
}

function formatCategory(category?: string) {
  if (!category) return '';
  if (category === 'health') return '건강';
  if (category === 'energy') return '에너지';
  if (category === 'dishwashing') return '설거지';
  return category;
}

function formatNotificationTime(time: string) {
  // "17:00:00" → "저녁 5시"
  const [hourStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return time;

  if (hour < 12) return `오전 ${hour}시`;
  if (hour === 12) return '정오 12시';
  if (hour < 18) return `오후 ${hour - 12}시`;
  return `저녁 ${hour - 12}시`;
}

// AI 박스 안에 들어갈 한글 문장 생성
function formatAiAnalysis(data: TodayReportResponse): string {
  const lines: string[] = [];

  // 1) 오늘 에너지 분위기 한 줄
  if (typeof data.energyHigh === 'boolean') {
    if (data.energyHigh) {
      lines.push('오늘은 에너지 사용량이 평소보다 조금 높은 편이에요.');
    } else {
      lines.push('오늘은 에너지 사용량이 비교적 안정적으로 유지되고 있어요.');
    }
  }

  // 2) 오늘의 개인 챌린지 (daily)
  if (data.daily) {
    const name = getChallengeName(data.daily.challengeId);
    const category = formatCategory(data.daily.category);
    lines.push(`오늘의 개인 챌린지: ${name} (${category})`);
  }

  // 3) 이번 달 가족 챌린지 (monthly)
  if (data.monthly) {
    const name = getChallengeName(data.monthly.challengeId);
    const category = formatCategory(data.monthly.category);
    lines.push(`이번 달 가족 챌린지: ${name} (${category})`);
  }

  // 4) 특정 시간에 하면 좋은 미션 (speed)
  if (data.speed) {
    const name = getChallengeName(data.speed.challengeId);
    const timeText = formatNotificationTime(data.speed.notificationTime);
    lines.push(
      `${timeText}에 진행하면 좋은 '${name}' 미션도 추천돼요. ` +
        `가족 포인트 ${data.speed.familyPoints}점, 개인 포인트 ${data.speed.personalPoints}점을 받을 수 있어요.`,
    );
  }

  if (lines.length === 0) {
    return '오늘의 데이터를 분석했지만, 추천할 만한 챌린지를 아직 찾지 못했어요.';
  }

  // 위에서 만든 문장들을 줄바꿈으로 이어서, 지금 UI 박스 안에 그대로 들어가게
  return lines.join('\n');
}

/* ────────────── FastAPI 호출 설정 ────────────── */
const AI_API_URL = 'https://callai-jb7eegn52q-du.a.run.app';

async function fetchTodayReportFromAPI(userId: string): Promise<string> {
  try {
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId, // 예: 'user_4'
        top_k: 3,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.log('[AI API ERROR]', res.status, errorText);
      throw new Error(errorText || `status ${res.status}`);
    }

    const data: TodayReportResponse = await res.json();
    console.log('[AI API RAW DATA]', data);

    // 여기서 JSON 전체를 문자열로 찍던 코드 대신,
    // 우리가 만든 formatAiAnalysis 사용
    return formatAiAnalysis(data);
  } catch (err) {
    console.error('[fetchTodayReportFromAPI] error:', err);
    throw err;
  }
}

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
      <View style={styles.line} />
    </View>
  );
}

/* ────────────── Room View (확대 / 이동 가능) ────────────── */
function RoomBlock() {
  const scale = useSharedValue(0.8);
  const baseScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);
  const navigation = useNavigation<NavigationProp<any>>();

  // Pinch & Pan Gesture 설정
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = baseScale.value * e.scale;
    })
    .onEnd(() => {
      baseScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = lastTranslateX.value + e.translationX;
      translateY.value = lastTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
      <Animated.View style={[styles.roomBlock, animatedStyle]}>
        {/* 방 이미지 */}
        <Image
          source={require('../../assets/rooms/room_1.png')}
          style={[styles.roomBase, styles.room1]}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/rooms/room_2.png')}
          style={[styles.roomBase, styles.room2]}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/rooms/room_3.png')}
          style={[styles.roomBase, styles.room3]}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/rooms/room_4.png')}
          style={[styles.roomBase, styles.room4]}
          resizeMode="cover"
        />

        {/* 캐릭터 */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Character')}
          style={styles.characterTouchable}
        >
          <Image
            source={require('../../assets/rooms/dong.png')}
            style={styles.character}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Character_2')}
          style={styles.character2Touchable}
        >
          <Image
            source={require('../../assets/rooms/jin.png')}
            style={styles.character2}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* 가구 / 오브젝트 */}
        <Image
          source={require('../../assets/rooms/desk.png')}
          style={styles.table}
          resizeMode="cover"
        />

        <Image
          source={require('../../assets/rooms/desk_2.png')}
          style={styles.table2}
          resizeMode="cover"
        />

        {/* LG 로고 */}
        <View style={styles.lgLogo}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Image
              key={i}
              source={require('../../assets/rooms/LG_logo.png')}
              style={[
                styles.logoBase,
                styles[`logo${i + 1}` as keyof typeof styles] as ImageStyle,
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

/* ────────────── Help Icons ────────────── */
function HelpIcons({ onReportPress }: { onReportPress: () => void }) {
  return (
    <View style={styles.helpIconsContainer}>
      <TouchableOpacity activeOpacity={0.7}>
        <Image
          source={require('../../assets/bars/add.png')}
          style={styles.helpAdd}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.7} onPress={onReportPress}>
        <Image
          source={require('../../assets/bars/report.png')}
          style={styles.helpReport}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

/* ────────────── Today’s Report Popup ────────────── */
type TodayReportPopupProps = {
  visible: boolean;
  onClose: () => void;
  aiText: string;
  aiLoading: boolean;
  aiError: string | null;
  onRetry: () => void;
};

function TodayReportPopup({
  visible,
  onClose,
  aiText,
  aiLoading,
  aiError,
  onRetry,
}: TodayReportPopupProps) {
  const renderAiText = () => {
    if (aiLoading) {
      return 'AI 패턴 분석을 불러오는 중입니다...';
    }
    if (aiError) {
      return `${aiError}\n\n다시 시도해보세요.`;
    }
    return aiText;
  };

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>Today’s Report</Text>

          {/* AI 분석 */}
          <View style={styles.aiBox}>
            <Text style={styles.aiLabel}>AI 패턴 분석 :</Text>
            <Text style={styles.aiText}>{renderAiText()}</Text>

            {/* 에러일 때만 재시도 버튼 노출 (선택사항) */}
            {aiError && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryText}>다시 시도</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.line2} />

          {/* 챌린지 요약 */}
          <View className="challenge-summary">
            <View style={styles.challengeBox}>
              <Image
                source={require('../../assets/main_icon/Subtract.png')}
                style={styles.challengeIcon}
              />
              <Text style={styles.challengeText}>
                이번 달의 가족 챌린지 : 난방 절약 성공!
              </Text>
              <Text style={styles.point}>+40p</Text>
            </View>

            <View style={styles.challengeBox}>
              <Image
                source={require('../../assets/main_icon/Subtract.png')}
                style={styles.challengeIcon}
              />
              <Text style={styles.challengeText}>
                이번 주의 가족 챌린지 : {'\n'}릴레이 로봇청소기 돌리기 성공
              </Text>
              <Text style={styles.point}>+50p</Text>
            </View>

            <View style={styles.challengeBox}>
              <Image
                source={require('../../assets/main_icon/Subtract.png')}
                style={styles.challengeIcon}
              />
              <Text style={styles.challengeText}>
                오늘의 개인 챌린지 : 아침에 물 한잔 마시기
              </Text>
              <Text style={styles.point}>+10p</Text>
            </View>
          </View>

          {/* 확인 버튼 */}
          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ────────────── Bottom Tab Bar ────────────── */
function BottomTabBar() {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity activeOpacity={0.7} style={styles.tabButton}>
        <Image
          source={require('../../assets/bars/home.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.tabButton}
        onPress={() => router.push('/two')}
      >
        <Image
          source={require('../../assets/bars/challenge.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.tabButton}
        onPress={() => router.push('/three')}
      >
        <Image
          source={require('../../assets/bars/reward.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.tabButton}
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

/* ────────────── Home Screen ────────────── */
export default function Home() {
  const [reportVisible, setReportVisible] = useState(false);

  const [aiText, setAiText] = useState(
    '오늘 하루 데이터 기반으로 패턴을 분석하고 있어요.',
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadTodayReport = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const text = await fetchTodayReportFromAPI('user_4');
      setAiText(text);
    } catch {
      throw new Error('AI 요청 중 오류 발생');
    } finally {
      setAiLoading(false);
    }
  };

  // 모달이 열릴 때마다 AI 분석 새로 불러오기
  useEffect(() => {
    if (reportVisible) {
      loadTodayReport();
    }
  }, [reportVisible]);

  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      <View style={styles.contentContainer}>
        <RoomBlock />
        <HelpIcons onReportPress={() => setReportVisible(true)} />
      </View>

      <BottomTabBar />

      {/* Report Modal */}
      <TodayReportPopup
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        aiText={aiText}
        aiLoading={aiLoading}
        aiError={aiError}
        onRetry={loadTodayReport}
      />
    </SafeAreaView>
  );
}

/* ────────────── Styles ────────────── */
const styles = StyleSheet.create({
  // 기본 구조
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

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
  line: {
    position: 'absolute',
    bottom: 0,
    height: 1,
    width: '100%',
    backgroundColor: '#E0E0E0',
  },

  // Room Layout
  roomBlock: {
    width: 418,
    height: 564,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  roomBase: { position: 'absolute' },
  room1: { width: 225, height: 232, left: 96, top: -6 },
  room2: { width: 251, height: 251, top: 318, left: 89 },
  room3: { width: 234, height: 236, top: 160, left: 0 },
  room4: { width: 232, height: 232, top: 164, left: 186 },

  characterTouchable: {
    position: 'absolute',
    top: 90,
    left: 175,
    width: 65,
    height: 85,
    zIndex: 5,
  },
  character: {
    position: 'absolute',
    width: 65,
    height: 85,
    resizeMode: 'contain',
  },

  character2Touchable: {
    position: 'absolute',
    top: 420, // 원하는 위치로 조정
    left: 218, // 원하는 위치로 조정
    width: 65,
    height: 85,
    zIndex: 5,
  },
  character2: {
    position: 'absolute',
    width: 65,
    height: 85,
    resizeMode: 'contain',
  },

  table: {
    position: 'absolute',
    width: 50,
    height: 30,
    top: 155,
    left: 160,
    resizeMode: 'contain',
    zIndex: 5,
  },

  table2: {
    position: 'absolute',
    width: 85,
    height: 65,
    top: 465,
    left: 193,
    resizeMode: 'contain',
    zIndex: 5,
  },

  // LG Logos
  lgLogo: { position: 'absolute', top: 70, left: 127, width: 212, height: 345 },
  logoBase: { position: 'absolute', width: 57, height: 46 },
  logo1: { top: 299, left: 1 },
  logo2: { top: 272, left: 78 },
  logo3: { top: 139, left: 95 },
  logo4: { top: 145, left: 155 },
  logo5: { top: 168, left: 32 },
  logo6: { top: 0, left: 0 },
  logo7: { top: 71, left: 78 },

  // Help Icons
  helpIconsContainer: {
    position: 'absolute',
    bottom: 22,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 360,
    zIndex: 10,
  },
  helpAdd: { width: 33, height: 33 },
  helpReport: { width: 27, height: 27, tintColor: 'rgba(54,54,54,1)' },

  // Popup
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportCard: {
    width: 335,
    height: 387,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    elevation: 8,
  },
  reportTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#353535',
    marginBottom: 5,
  },
  aiBox: {
    width: 275,
    height: 89,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: 'space-around',
    alignSelf: 'center',
  },
  aiLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#A0A0A0',
    left: 3,
  },
  aiText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#000',
    lineHeight: 15,
    left: 7,
    marginTop: 3,
    marginBottom: 3,
  },
  line2: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginVertical: 8,
  },
  challengeBox: {
    backgroundColor: '#F6F6F6',
    marginTop: 4,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#000',
    flex: 1,
    textAlignVertical: 'center',
  },
  point: {
    fontFamily: 'Roboto-Medium',
    fontSize: 12,
    color: '#FF4D4F',
  },
  challengeIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    resizeMode: 'contain',
  },
  confirmButton: {
    backgroundColor: '#353535',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
    alignItems: 'center',
    width: 293,
    height: 43,
  },
  confirmText: {
    color: '#fff',
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
  },

  // Bottom Tab
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

  retryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EFEFEF',
  },
  retryText: {
    fontSize: 12,
    color: '#333333',
  },
});
