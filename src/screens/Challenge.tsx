import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

import { auth } from '../firebase/firebase';

import { challengeService } from '@/src/services/challengeService';
import type {
  Challenge as ChallengeItem,
  Filter,
} from '@/src/store/useChallengeStore';
import { useChallengeStore } from '@/src/store/useChallengeStore';

const AI_API_URL = 'https://callai-jb7eegn52q-du.a.run.app';

// ───── AI 추천 응답 타입 ─────
type ChallengeInfoFromAI = {
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

type SpeedInfoFromAI = {
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
  daily?: ChallengeInfoFromAI;
  monthly?: ChallengeInfoFromAI;
  speed?: SpeedInfoFromAI;
};

type Period = 'daily' | 'weekly' | 'monthly' | 'relay' | 'speed';

function formatPeriodLabel(period?: Period) {
  switch (period) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'relay':
      return 'Relay';
    case 'speed':
      return 'Speed'; // 여기 원하는 라벨로 바꿔도 됨 (예: 'Speed' 대신 '스피드')
    default:
      return 'Daily';
  }
}

// challengeId → 카드에 쓸 이름
function getChallengeNameFromId(challengeId: string) {
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

// AI 응답 → ChallengeItem[] 로 변환
function mapAiResponseToChallenges(data: TodayReportResponse): ChallengeItem[] {
  const result: ChallengeItem[] = [];

  // 아침·저녁 물 두 잔 마시기 → 나 | 헬스
  if (data.daily) {
    result.push({
      id: data.daily.challengeId,
      title: getChallengeNameFromId(data.daily.challengeId),
      audience: '나',
      category: '헬스',
      period: 'daily',
      rewardPoints: 10,
      progressPct: 0,
    } as ChallengeItem);
  }

  // 한 달간 난방 절약 → 가족 | 절약
  if (data.monthly) {
    result.push({
      id: data.monthly.challengeId,
      title: getChallengeNameFromId(data.monthly.challengeId),
      audience: '가족',
      category: '절약',
      period: 'monthly',
      rewardPoints: 40,
      progressPct: 0,
    } as ChallengeItem);
  }

  // 저녁 식기세척기 스피드 → 가족 | 가사
  if (data.speed) {
    result.push({
      id: data.speed.challengeId,
      title: getChallengeNameFromId(data.speed.challengeId),
      audience: '가족',
      category: '가사',
      period: 'speed',
      rewardPoints: data.speed.familyPoints ?? 0,
      progressPct: 0,
    } as ChallengeItem);
  }

  return result;
}

// 실제 API 호출 함수
async function fetchAiRecommendedChallenges(
  userId: string,
): Promise<ChallengeItem[]> {
  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      top_k: 3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log('[AI Challenge ERROR]', res.status, text);
    throw new Error(text || `status ${res.status}`);
  }

  const data: TodayReportResponse = await res.json();

  return mapAiResponseToChallenges(data);
}

type Audience = '전체' | '나' | '가족';

type CategoryFilterGroupProps = {
  audience: Audience;
  category: Filter; // '전체' | '절약' | '가사' | '헬스'
  onAudienceChange: (value: Audience) => void;
  onCategoryChange: (value: Filter) => void;
};

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerLogo}>HomeQuest</Text>

      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => router.push('/Setting')}
      >
        <Image
          source={require('../../assets/images/SettingButton.png')}
          style={styles.settingIcon}
        />
      </TouchableOpacity>

      <View style={styles.line7} />
    </View>
  );
}

function CategoryButton({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        active ? styles.categoryButtonActive : styles.categoryButtonInactive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.categoryButtonText,
          active
            ? styles.categoryButtonTextActive
            : styles.categoryButtonTextInactive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CategoryFilterGroup({
  audience,
  category,
  onAudienceChange,
  onCategoryChange,
}: CategoryFilterGroupProps) {
  return (
    <View style={styles.categoryFilterGroup}>
      {/* 1줄: 나 / 가족 */}
      <View style={styles.categoryRow}>
        <CategoryButton
          label="전체"
          active={audience === '전체'}
          onPress={() => onAudienceChange('전체')}
        />
        <View style={{ width: 12 }} />
        <CategoryButton
          label="나"
          active={audience === '나'}
          onPress={() => onAudienceChange('나')}
        />
        <View style={{ width: 12 }} />
        <CategoryButton
          label="가족"
          active={audience === '가족'}
          onPress={() => onAudienceChange('가족')}
        />
      </View>

      {/* 2줄: 전체 / 절약 / 가사 / 헬스 */}
      <View style={styles.categoryRow2}>
        <CategoryButton
          label="전체"
          active={category === '전체'}
          onPress={() => onCategoryChange('전체')}
        />
        <View style={{ width: 12 }} />
        <CategoryButton
          label="절약"
          active={category === '절약'}
          onPress={() => onCategoryChange('절약')}
        />
        <View style={{ width: 12 }} />
        <CategoryButton
          label="가사"
          active={category === '가사'}
          onPress={() => onCategoryChange('가사')}
        />
        <View style={{ width: 12 }} />
        <CategoryButton
          label="헬스"
          active={category === '헬스'}
          onPress={() => onCategoryChange('헬스')}
        />
      </View>
    </View>
  );
}

function MyChallengeSection() {
  return (
    <View style={styles.myChallengeSection}>
      <Text style={styles.sectionTitle}>나의 챌린지 현황</Text>

      <View style={styles.missionStatsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>50</Text>
          <Text style={styles.statLabel}>참여한 미션</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>34</Text>
          <Text style={styles.statLabel}>성공한 미션</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>68%</Text>
          <Text style={styles.statLabel}>미션 성공률</Text>
        </View>
      </View>
    </View>
  );
}

type ChallengeCardVariant = 'water' | 'heating' | 'dishwasher' | 'default';

function ChallengeCard({
  category,
  type,
  title,
  //badgeText,
  progressRatio,
  onPressDetail,
  variant = 'default',
}: {
  category: string;
  type: string;
  title: string;
  badgeText: string;
  progressRatio: number;
  onPressDetail?: () => void;
  variant?: ChallengeCardVariant;
}) {
  const hasProgress = progressRatio > 0;

  type CardTheme = {
    badgeStyle?: object;
    progressColor?: string;
  };

  const getCardTheme = (v: ChallengeCardVariant): CardTheme => {
    switch (v) {
      case 'water':
        return {
          badgeStyle: { backgroundColor: '#5E75FD' },
          progressColor: '#5E75FD',
        };
      case 'heating':
        return {
          badgeStyle: { backgroundColor: '#5E75FD' },
          progressColor: '#5E75FD',
        };
      case 'dishwasher':
        return {
          badgeStyle: { backgroundColor: '#5E75FD' },
          progressColor: '#5E75FD',
        };
      default:
        return {
          badgeStyle: {},
          progressColor: '#5E75FD',
        };
    }
  };

  const theme = getCardTheme(variant);
  const clamped = Math.max(0, Math.min(progressRatio, 1));
  const bubbleX = clamped === 0 ? 0.03 : clamped;

  return (
    <View style={[styles.challengeCard]}>
      <View style={styles.challengeCardHeader}>
        <Text style={styles.challengeMetaText}>{category}</Text>
        <View style={styles.metaDivider} />
        <Text style={styles.challengeMetaText}>{type}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={onPressDetail}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Image
            source={require('../../assets/images/tabler_chevron-left.png')}
            style={styles.chevronIcon}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.challengeTitle}>{title}</Text>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          {hasProgress && (
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${clamped * 100}%`,
                  backgroundColor: theme.progressColor,
                },
              ]}
            />
          )}
        </View>

        {/* 👉 여기: hasProgress 제거하고 항상 렌더링 */}
        <View
          style={[
            styles.cardProgressBubble,
            { left: `${clamped * 100}%` },
            { left: `${bubbleX * 100}%` },
          ]}
        >
          <Text style={styles.cardProgressBubbleText}>
            {Math.round(clamped * 100)}%
          </Text>
          <View style={styles.cardProgressBubbleTail} />
        </View>
      </View>
    </View>
  );
}

function getVariantFromChallengeId(id: string): ChallengeCardVariant {
  switch (id) {
    case 'daily_water_2':
      return 'water';
    case 'monthly_heating':
      return 'heating';
    case 'speed_dishwasher':
      return 'dishwasher';
    default:
      return 'default';
  }
}

function ChallengeProgressSection({ items }: { items: ChallengeItem[] }) {
  return (
    <View style={styles.challengeProgressSection}>
      <Text style={[styles.sectionTitle, styles.progressSectionTitle]}>
        진행중인 챌린지
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.challengeCardList}
      >
        {items.length === 0 ? (
          <Text style={{ color: '#999', marginLeft: 20 }}>
            진행중인 챌린지가 없어요.
          </Text>
        ) : (
          items.map((c) => (
            <ChallengeCard
              key={c.id}
              category={c.category}
              type={formatPeriodLabel(c.period)}
              title={c.title}
              badgeText={`${c.rewardPoints ?? 0}p`}
              progressRatio={(c.progressPct ?? 0) / 100}
              variant={getVariantFromChallengeId(c.id)}
              onPressDetail={() => {}}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// challengeId → 이미지 매핑
function getChallengeImage(id: string) {
  switch (id) {
    case 'daily_water_2':
      return require('../../assets/images/water.png');
    case 'monthly_heating':
      return require('../../assets/images/save.png');
    default:
      return require('../../assets/images/dishwasher.png'); // 기본 이미지
  }
}

// challengeId → 스타일 매핑
function getChallengeImageStyle(id: string) {
  switch (id) {
    case 'daily_water_2':
      return styles.waterIcon; // 물 챌린지 전용 스타일
    case 'monthly_heating':
      return styles.heatingIcon; // 난방 절약 전용 스타일
    case 'speed_dishwasher':
      return styles.dishwasherIcon; // 기존 식기세척기 스타일
    default:
      return styles.defaultIcon; // 기본 스타일
  }
}

function RecommendedChallengeSection({
  items,
  onPressStart,
  onIndexChange,
  onDismiss,
  onRefresh,
}: {
  items: ChallengeItem[];
  onPressStart: (id: string) => void;
  onIndexChange: (index: number) => void;
  onDismiss: (id: string) => void;
  onRefresh: () => void;
}) {
  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const width = e.nativeEvent.layoutMeasurement.width || 1;
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / width);
    onIndexChange(index);
  };

  if (items.length === 0) {
    return (
      <View style={{ marginTop: 40, marginBottom: 20 }}>
        <Text style={{ color: '#999', textAlign: 'center' }}>
          추천 챌린지가 없어요.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.recommendedChallengeSection}>
      <View style={styles.recommendedHeader}>
        <Text style={styles.recommendTitle}>추천 챌린지</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        horizontal
        pagingEnabled
        keyExtractor={(item, index) => `${item.id}-${index}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 24 }}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <View style={styles.recommendedCard}>
            {/* 삭제 버튼 */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                console.log('❌ dismiss:', item.id);
                onDismiss(item.id);
              }}
            >
              <Image
                source={require('../../assets/images/Vector.png')}
                style={styles.deleteIcon}
              />
            </TouchableOpacity>

            <View style={styles.recommendedMetaRow}>
              <Text style={styles.challengeMetaText}>{item.audience}</Text>
              <View style={styles.metaDivider} />
              <Text style={styles.challengeMetaText}>{item.category}</Text>
              <Text style={styles.challengePeriodText}>
                {formatPeriodLabel(item.period)}
              </Text>
            </View>

            <View style={styles.recommendedContentRow}>
              <Image
                source={getChallengeImage(item.id)}
                style={getChallengeImageStyle(item.id)}
              />

              <View style={styles.recommendedTextCol}>
                <Text style={styles.recommendedTitle}>{item.title}</Text>
                <Text style={styles.recommendedPoint}>
                  {item.rewardPoints ?? 0}p 받기
                </Text>
              </View>

              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => {
                  console.log('🚀 onPressStart challengeId:', item.id);
                  onPressStart(item.id);
                }}
              >
                <Text style={styles.ctaButtonText}>도전</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  challengeService.resetUserChallenges();
                }}
                style={{
                  alignSelf: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: '#eee',
                  marginTop: 8,
                }}
              >
                <Text style={{ color: '#333' }}>
                  개발용: 진행중 챌린지 초기화
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function PageIndicatorDots({
  activeIndex,
  total,
}: {
  activeIndex: number;
  total: number;
}) {
  if (total <= 1) return null;

  return (
    <View style={styles.pageIndicatorDots}>
      {Array.from({ length: total }).map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.dotBase,
            idx === activeIndex ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

function BottomTabBar() {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.7}
        onPress={() => router.push('/')}
      >
        <Image
          source={require('../../assets/images/home.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.7}
        onPress={() => {
          // 현재 탭: Challenge
        }}
      >
        <Image
          source={require('../../assets/images/challenge.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.7}
        onPress={() => router.push('/three')}
      >
        <Image
          source={require('../../assets/images/reward.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.7}
        onPress={() => router.push('/four')}
      >
        <Image
          source={require('../../assets/images/ranking.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

// 메인 페이지
export function Challenge() {
  const [activeRecIndex, setActiveRecIndex] = useState(0);
  const [audience, setAudience] = useState<Audience>('전체');

  // 🔹 AI 추천 결과를 담을 state
  const [aiRecommended, setAiRecommended] = useState<ChallengeItem[]>([]);
  const [_aiLoading, setAiLoading] = useState(false);

  const {
    currentFilter,
    setFilter,
    hydrate,
    startChallenge,
    ongoing,
    //recommended,
    //dismissRecommendation,
  } = useChallengeStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);
  // 여기 추가: Firestore 타는 도전 핸들러
  const handlePressStart = async (challengeId: string) => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        '로그인이 필요해요',
        '챌린지를 시작하려면 먼저 로그인해주세요.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '로그인하러 가기',
            onPress: () => {
              router.push('/login');
            },
          },
        ],
      );
      return;
    }

    try {
      // 1) Firestore 진행중 챌린지 생성
      await startChallenge(challengeId);

      // 2) 로컬 진행중/추천 리스트 재동기화
      await hydrate();

      // 3) AI 추천 리스트에서도 해당 챌린지 제거
      setAiRecommended((prev) => prev.filter((c) => c.id !== challengeId));
    } catch (e) {
      console.log('[Challenge] startChallenge error:', e);
      Alert.alert(
        '챌린지 시작 오류',
        '챌린지를 시작하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
      );
    }
  };

  // 🔹 AI 추천 불러오기 함수
  const loadAiRecommended = async () => {
    try {
      setAiLoading(true);

      const user = auth.currentUser;
      // 1) 로그인 안 되어 있으면 일단 기본 추천만
      const userId = user?.uid ?? 'user_4';

      // 2) AI 추천 리스트
      const list = await fetchAiRecommendedChallenges(userId);

      // 3) Firestore 에서 "숨긴 추천" 목록 읽기
      const dismissedIds = await challengeService.getDismissedRecommendedIds();

      // 4) 숨긴 애들 빼고 세팅
      const filtered = list.filter((c) => !dismissedIds.includes(c.id));

      setAiRecommended(filtered);
    } catch (e) {
      console.log('[loadAiRecommended] error:', e);
    } finally {
      setAiLoading(false);
    }
  };

  // 최초 진입 시: 기존 hydrate + AI 추천 함께 호출
  useEffect(() => {
    loadAiRecommended();
  }, []);

  const onCategoryChange = (filter: Filter) => {
    console.log('📌 onCategoryChange:', filter);
    setFilter(filter);
    hydrate();
  };

  // audience: 나 / 가족 필터
  // currentFilter: 전체 / 절약 / 가사 / 헬스 필터
  const matchesFilter = (c: ChallengeItem) => {
    const matchAudience = audience === '전체' || c.audience === audience;
    const matchCategory =
      currentFilter === '전체' || c.category === currentFilter;
    return matchAudience && matchCategory;
  };

  const filteredOngoing = ongoing.filter(matchesFilter);
  const filteredRecommended = aiRecommended
    .filter(matchesFilter)
    .filter((rec) => !ongoing.some((og) => og.id === rec.id));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.main}>
          <CategoryFilterGroup
            audience={audience}
            category={currentFilter}
            onAudienceChange={(v) => {
              console.log('📌 onAudienceChange:', v);
              setAudience(v);
            }}
            onCategoryChange={onCategoryChange}
          />

          <MyChallengeSection />

          <ChallengeProgressSection items={filteredOngoing} />

          <RecommendedChallengeSection
            items={filteredRecommended}
            onPressStart={handlePressStart}
            onIndexChange={setActiveRecIndex}
            onDismiss={async (id) => {
              // 1) 로컬에서 바로 제거
              setAiRecommended((prev) => prev.filter((c) => c.id !== id));

              // 2) Firestore에 "이 유저는 이 추천을 숨겼다" 저장
              try {
                await challengeService.dismissRecommendedChallenge(id);
              } catch (e) {
                console.log(
                  '[onDismiss] dismissRecommendedChallenge error:',
                  e,
                );
              }
            }}
            onRefresh={() => {
              hydrate();
              loadAiRecommended();
            }}
          />
        </View>
      </ScrollView>
      <PageIndicatorDots
        activeIndex={activeRecIndex}
        total={filteredRecommended.length}
      />
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  main: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30, // main 위치 x=30
    paddingTop: 20,
    paddingBottom: 16,
  },

  /* 헤더 */
  header: {
    width: '100%',
    height: 53,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  headerLogo: {
    fontFamily: 'Agbalumo',
    fontSize: 20,
    color: '#353535',
  },
  settingButton: {
    position: 'absolute',
    width: 24,
    height: 24,
    right: 14,
    top: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIcon: {
    width: 24,
    height: 24,
    tintColor: '#353535',
    resizeMode: 'contain',
  },
  line7: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
  },

  /* 카테고리 필터 그룹 */
  categoryFilterGroup: {
    marginTop: 0,
    marginBottom: 30,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  categoryButton: {
    width: 68,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    minHeight: 33,
    justifyContent: 'center',
    alignItems: 'center',
    // 그림자 (iOS)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 11,
    elevation: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryButtonInactive: {
    backgroundColor: '#F4F4F4',
  },
  categoryButtonText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#7B7B7B',
  },
  categoryButtonTextInactive: {
    color: '#D8D8D8',
  },

  /* 공통 섹션 타이틀 */
  sectionTitle: {
    fontSize: 16,
    color: '#353535',
    marginBottom: 15,
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  // 진행중인 챌린지 전용
  progressSectionTitle: {
    // 여기서 원하는 것만 덮어쓰기
    // 예시) 색, 마진, 폰트 굵기 등
    marginBottom: -12,
    color: '#353535',
    marginLeft: 20,
  },

  recommendTitle: {
    fontSize: 16,
    color: '#353535',
    marginBottom: -30,
    fontFamily: 'Roboto',
    fontWeight: '500',
    marginLeft: 30,
  },

  /* 나의 챌린지 현황 */
  myChallengeSection: {
    marginBottom: 25,
  },
  missionStatsCard: {
    width: 335,
    height: 87,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // 그림자
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    color: '#353535',
    marginBottom: 5,
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  statLabel: {
    fontSize: 12,
    color: '#353535',
    fontFamily: 'Roboto',
  },
  verticalDivider: {
    width: 1,
    height: 57,
    backgroundColor: '#7B7B7B',
  },

  /* 진행중인 챌린지 */
  challengeProgressSection: {
    marginBottom: -10,
    marginLeft: -20,
    marginRight: -30,
  },
  challengeCardList: {
    paddingVertical: 30,
    paddingRight: 16,
    paddingLeft: 20,
  },

  challengeCard: {
    width: 160,
    height: 108,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    // 그림자
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  challengeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  challengeMetaText: {
    fontSize: 12,
    color: '#7B7B7B',
    fontFamily: 'Roboto',
    marginLeft: 2,
  },
  challengePeriodText: {
    fontSize: 12,
    color: '#7B7B7B',
    fontFamily: 'Roboto',
    marginLeft: 10,
  },
  metaDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#7B7B7B',
    marginHorizontal: 4,
  },
  chevronIcon: {
    width: 15, // 아이콘 크기 조정 (필요에 따라 10~16)
    height: 15,
    tintColor: '#7B7B7B', // 색상 변경 (원본 그대로 쓰려면 이 줄 삭제)
    resizeMode: 'contain', // 비율 유지
  },

  challengeTitle: {
    fontSize: 13,
    color: '#353535',
    marginBottom: 6,
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#5E75FD',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
    marginLeft: 51,
  },
  badge2: {
    alignSelf: 'flex-start',
    backgroundColor: '#5E75FD',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },

  badgeTriangle: {
    width: 10, // PNG 실제 크기에 맞게 조정
    height: 8, // PNG 실제 크기에 맞게 조정
    marginTop: -6, // 배지와 겹치지 않게 살짝 위로
    marginLeft: 75, // 배지의 중앙에 오도록 위치 조정
    resizeMode: 'contain',
    alignSelf: 'flex-start', // 또는 'center'로 중앙 정렬
  },
  badgeTriangle2: {
    width: 10, // PNG 실제 크기에 맞게 조정
    height: 8, // PNG 실제 크기에 맞게 조정
    marginTop: -6, // 배지와 겹치지 않게 살짝 위로
    marginLeft: 13, // 배지의 중앙에 오도록 위치 조정
    resizeMode: 'contain',
    alignSelf: 'flex-start', // 또는 'center'로 중앙 정렬
  },

  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
  },
  badgeText2: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
  },
  progressBarBg: {
    height: 9,
    //marginLeft: 10,
    //marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#F6F6F6',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#5E75FD',
  },
  progressBarContainer: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 17,
    position: 'relative',
  },

  // 진행중 카드 위 파란 말풍선
  cardProgressBubble: {
    position: 'absolute',
    bottom: 14, // 바 위로 살짝 띄우기
    transform: [{ translateX: -21 }], // 말풍선 가로폭 ~56 기준 중앙정렬
    backgroundColor: '#5E75FD', // 파란색
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },

  cardProgressBubbleText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  cardProgressBubbleTail: {
    position: 'absolute',
    bottom: -4, // 말풍선 아래로 살짝 내려가게
    left: '50%',
    marginLeft: 6,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#5E75FD', // 말풍선과 같은 파란색
  },

  /* 추천 챌린지 */
  recommendedChallengeSection: {
    marginLeft: -30,
    marginBottom: -40,
    marginRight: -24,
  },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  refreshIcon: {
    marginRight: 260,
    fontSize: 20,
    marginTop: 2,
    fontWeight: '500',
    marginBottom: -30,
  },
  recommendedCard: {
    marginLeft: 30,
    marginRight: 20,
    marginTop: 35,
    marginBottom: 30,
    width: 335,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    // 그림자
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    paddingHorizontal: 23,
    paddingVertical: 14,
  },

  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    padding: 4,
    zIndex: 10, // 다른 요소 위로 오게
  },

  deleteIcon: {
    width: 11,
    height: 11,
    tintColor: '#7B7B7B', // 필요시 색상 변경, 원본색 유지하려면 제거
    resizeMode: 'contain',
  },

  recommendedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  metaIcon: {
    width: 11,
    height: 11,
    marginHorizontal: 4, // 텍스트와 약간의 간격
    resizeMode: 'contain',
    tintColor: '#7B7B7B', // 아이콘 색 (필요 없으면 제거)
  },
  recommendedContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dishwasherIcon: {
    width: 45,
    height: 50,
    resizeMode: 'contain',
    marginRight: 15,
    marginLeft: 16,
  },
  waterIcon: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    marginRight: 10,
    marginTop: -9,
  },

  heatingIcon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginRight: 10,
    marginTop: -7,
  },

  defaultIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    opacity: 0.9,
  },

  recommendedTextCol: {
    flex: 1,
  },
  recommendedTitle: {
    fontSize: 13,
    color: '#353535',
    marginBottom: 4,
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  recommendedPoint: {
    fontSize: 13,
    color: '#FDD529',
    fontWeight: '500',
  },
  ctaButton: {
    width: 45,
    height: 29,
    borderRadius: 10,
    backgroundColor: '#353535',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
  },

  /* 페이지 인디케이터 & 탭바 */
  pageIndicatorDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },

  dotBase: {
    width: 6, // 도트 크기
    height: 6,
    borderRadius: 3, // 완전한 동그라미
    marginHorizontal: 4,
  },

  dotActive: {
    backgroundColor: '#8C8C8C', // 가운데 진한 회색
  },

  dotInactive: {
    backgroundColor: '#E0E0E0', // 양쪽 연한 회색
  },

  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 75,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },

  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  tabIcon: {
    width: 50,
    height: 50,
  },
  /* ===== 상세 하단시트 ===== */

  detailSheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 1, // 탭바 위
    alignItems: 'center',
  },
  detailContainer: {
    width: '100%',
    maxWidth: 393,
    height: 700,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  detailArrowButton: {
    alignSelf: 'center',
    marginBottom: 0,
  },
  detailArrowIcon: {
    width: 31,
    height: 43,
    resizeMode: 'contain',
  },
  detailHeader: {
    marginBottom: -7,
    marginLeft: 20,
  },
  detailCategoryLabel: {
    color: '#A0A0A0',
    fontFamily: 'Roboto',
    fontSize: 15,
    marginBottom: 7,
  },
  detailTitle: {
    width: 298,
    color: '#353535',
    fontFamily: 'Roboto',
    fontSize: 15,
  },

  detailProgressWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailProgressDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 54,
    marginBottom: -33,
  },
  detailDotDone: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5E75FD',
  },
  detailDotYet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D9D9D9',
  },
  detailRobotIcon: {
    width: 60,
    height: 59,
    resizeMode: 'contain',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    zIndex: 10,
  },
  detailProgressLineBg: {
    width: 243,
    height: 6,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  detailProgressLineFill: {
    width: 164,
    height: 6,
    borderRadius: 10,
    backgroundColor: '#5E75FD',
  },
  progressBubbleTail: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#353535',
  },

  detailMetaPillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 11,
    marginTop: 4,
    marginBottom: 12,
  },
  detailMetaPill: {
    width: 91,
    height: 19,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#353535',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailMetaPillText: {
    fontSize: 12,
    color: '#353535',
    fontFamily: 'Roboto',
  },
  detailDivider: {
    height: 1,
    width: '120%',
    backgroundColor: '#E0E0E0',
    marginLeft: -24,
    marginRight: -24,
    marginBottom: 8,
  },

  /* 댓글 리스트 */
  commentSection: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  commentCountLabel: {
    color: '#A0A0A0',
    fontFamily: 'Roboto',
    fontSize: 15,
    marginBottom: 4,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  commentRowDad: {
    marginLeft: 40, // 숫자 키워서 원하는 만큼 이동해 봐
    // 또는 paddingLeft: 12,
  },
  commentAvatarWrapper: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    marginRight: 15,
  },
  commentAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  commentContent: {
    flex: 1,
    paddingRight: 8,
  },
  commentAuthor: {
    color: '#353535',
    fontFamily: 'Roboto',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    color: '#353535',
    fontFamily: 'Roboto',
    fontSize: 15,
    marginBottom: 2,
  },
  commentMeta: {
    color: '#A0A0A0',
    fontFamily: 'Roboto',
    fontSize: 13,
  },
  commentLikeBox: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  commentLikeIcon: {
    width: 21,
    height: 21,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  commentLikeCount: {
    color: '#A0A0A0',
    fontFamily: 'Roboto',
    fontSize: 13,
  },
  commentInnerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },

  /* 댓글 입력 바 */
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: -24,
    marginBottom: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontFamily: 'Roboto',
    fontSize: 16,
    color: '#353535',
    marginRight: 8,
    height: 41,
  },
  commentSendButton: {
    width: 56,
    height: 41,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: '#A0A0A0',
  },
});

export default Challenge;
