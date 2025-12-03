// src/screens/Challenge.tsx
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

import ChallengeDetail from '@/src/components/ChallengeDetail';
import { auth } from '@/src/firebase/firebase';
import { challengeService } from '@/src/services/challengeService';
import { useAuthStore } from '@/src/store/useAuthStore';
import type {
  Challenge as ChallengeItem,
  Filter,
} from '@/src/store/useChallengeStore';
import { useChallengeStore } from '@/src/store/useChallengeStore';

type Audience = '나' | '가족';
type DurationFilter = '전체' | '데일리' | '위클리' | '먼슬리';

type CategoryFilterGroupProps = {
  audience: Audience;
  category: Filter; // '전체' | '절약' | '가사' | '헬스'
  onAudienceChange: (value: Audience) => void;
  onCategoryChange: (value: Filter) => void;
};

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

// durationType → 한글 라벨
const mapDurationTypeToLabel = (durationType?: string): string => {
  switch (durationType) {
    case 'daily':
      return '데일리';
    case 'weekly':
      return '위클리';
    case 'speed':
      return '스피드';
    case 'monthly':
      return '먼슬리';
    default:
      return '데일리';
  }
};

// 영어 timeslot → 한국어
const formatTimeSlotLabel = (timeSlot?: string): string => {
  if (!timeSlot) return '';

  switch (timeSlot) {
    case 'morning':
      return '아침';
    case 'afternoon':
      return '오후';
    case 'evening':
      return '저녁';
    case 'night':
      return '밤';
    default:
      return timeSlot;
  }
};

/*const formatProgressBadge = (c: ChallengeItem): string => {
  const cur = c.currentValue ?? 0;
  const target = c.targetValue ?? 0;
  const unit = c.unit ?? '';

  if (!target) {
    return unit ? `${cur}${unit}` : `${cur}`;
  }
  return unit ? `${cur}/${target}${unit}` : `${cur}/${target}`;
};*/

// challengeId → 카드에 쓸 이름
function getChallengeNameFromId(challengeId: string) {
  switch (challengeId) {
    case 'daily_water_2':
      return '물 한 잔 마시기';
    case 'monthly_heating':
      return '한 달간 난방 절약';
    case 'speed_dishwasher':
      return '식기세척기 스피드 챌린지';
    default:
      return challengeId;
  }
}

function getOngoingCategoryLabel(c: ChallengeItem): string {
  // 이미 도메인 카테고리가 제대로 들어온 경우는 그걸 그대로 사용
  if (c.domainCategory && c.domainCategory !== '전체') {
    return c.domainCategory;
  }

  // 아직 '전체'로만 오는 템플릿들은 ID 기준으로 강제 매핑
  switch (c.id) {
    case 'daily_water_2':
      return '헬스';
    case 'monthly_heating':
    case 'ch_saving_heater_day':
    case 'ch_saving_heater_m1':
      return '절약';
    case 'speed_dishwasher':
      return '가사';
    default:
      return '전체';
  }
}

// AI 응답 → ChallengeItem[] 로 변환 (UI에서 쓰는 필드만 세팅)
function mapAiResponseToChallenges(data: TodayReportResponse): ChallengeItem[] {
  const result: ChallengeItem[] = [];

  // daily_water_2 → 나 | 헬스 | 데일리
  if (data.daily) {
    result.push({
      id: data.daily.challengeId,
      title: getChallengeNameFromId(data.daily.challengeId),
      category: '나', // audience 필터용
      domainCategory: '헬스', // 절약 / 가사 / 헬스
      durationType: 'daily',
      rewardPoints: 10,
      progressPct: 0,
      currentValue: 0,
      targetValue: 1,
      unit: '회',
    } as ChallengeItem);
  }

  // monthly_heating → 가족 | 절약 | 먼슬리
  if (data.monthly) {
    result.push({
      id: data.monthly.challengeId,
      title: getChallengeNameFromId(data.monthly.challengeId),
      category: '가족',
      domainCategory: '절약',
      durationType: 'monthly',
      rewardPoints: 40,
      progressPct: 0,
      currentValue: 0,
      targetValue: 30,
      unit: '일',
    } as ChallengeItem);
  }

  // speed_dishwasher → 나 | 가사 | 데일리 (저녁)
  if (data.speed) {
    result.push({
      id: data.speed.challengeId,
      title: getChallengeNameFromId(data.speed.challengeId),
      category: '나', // 개인 챌린지이므로 '나'
      domainCategory: '가사',
      durationType: 'speed',
      rewardPoints: data.speed.personalPoints ?? 0, // 개인 포인트 사용
      progressPct: 0,
      currentValue: 0,
      targetValue: 1,
      unit: '회',
      recommendedTimeSlot: 'evening',
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

/* ================== UI 컴포넌트 ================== */

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

function MyChallengeSection({
  audience,
  mySummary,
  familySummary,
}: {
  audience: Audience;
  mySummary: {
    totalParticipated: number;
    totalCompleted: number;
    successRate: number;
  };
  familySummary: {
    totalParticipated: number;
    totalCompleted: number;
    successRate: number;
  };
}) {
  const isMe = audience === '나';
  const data = isMe ? mySummary : familySummary;
  const titleText = isMe ? '나의 챌린지 현황' : '가족 챌린지 현황';

  return (
    <View style={styles.myChallengeSection}>
      <Text style={styles.sectionTitle}>{titleText}</Text>

      <View style={styles.missionStatsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{data.totalParticipated}</Text>
          <Text style={styles.statLabel}>참여한 미션</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{data.totalCompleted}</Text>
          <Text style={styles.statLabel}>성공한 미션</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{data.successRate}%</Text>
          <Text style={styles.statLabel}>미션 성공률</Text>
        </View>
      </View>
    </View>
  );
}

/* ===== 진행중 카드: 예전 디자인(퍼센트 말풍선) ===== */

// challengeId 별 기본 단위 매핑
function getUnitFromChallengeId(id: string): string {
  switch (id) {
    case 'daily_water_2':
      return '잔';
    case 'speed_dishwasher':
      return '회';
    case 'monthly_heating':
      return 'kWh';
    default:
      return ''; // 단위 없음
  }
}

type ChallengeCardVariant = 'water' | 'heating' | 'dishwasher' | 'default';

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

function ChallengeCard({
  id,
  category,
  type,
  title,
  progressRatio,
  currentValue,
  targetValue,
  unit,
  onPressDetail,
  variant = 'default',
}: {
  id: string;
  category: string;
  type: string;
  title: string;
  progressRatio: number;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  onPressDetail?: () => void;
  variant?: ChallengeCardVariant;
}) {
  type CardTheme = {
    progressColor?: string;
  };

  const getCardTheme = (v: ChallengeCardVariant): CardTheme => {
    switch (v) {
      case 'water':
      case 'heating':
      case 'dishwasher':
        return {
          progressColor: '#5E75FD',
        };
      default:
        return {
          progressColor: '#5E75FD',
        };
    }
  };

  const theme = getCardTheme(variant);
  const clamped = Math.max(0, Math.min(progressRatio, 1));
  const bubbleLeftPct = clamped === 0 ? 5 : clamped * 100; // 0%일 때는 막대 맨 왼쪽에서 조금 떨어진 위치

  // 🔹 버블 안에 들어갈 텍스트
  const cur = currentValue ?? 0;
  const tgt = targetValue ?? 0;
  const effectiveUnit = unit && unit !== '' ? unit : getUnitFromChallengeId(id);

  let bubbleText: string;

  if (!effectiveUnit) {
    // 단위가 진짜 아무것도 없으면 퍼센트로 fallback
    bubbleText = `${Math.round(clamped * 100)}%`;
  } else if (effectiveUnit === '잔' || effectiveUnit === '회') {
    // 잔/회 → "1/2잔"
    bubbleText =
      tgt > 0 ? `${cur}/${tgt}${effectiveUnit}` : `${cur}${effectiveUnit}`;
  } else if (effectiveUnit.toLowerCase() === 'kwh') {
    // kWh → "0.8 kWh"
    bubbleText = `${cur.toFixed(1)} ${effectiveUnit}`;
  } else {
    // 기타 단위 → "현재/목표단위"
    bubbleText =
      tgt > 0 ? `${cur}/${tgt}${effectiveUnit}` : `${cur}${effectiveUnit}`;
  }

  return (
    <View style={styles.challengeCard}>
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
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${clamped * 100}%`,
                backgroundColor: theme.progressColor,
              },
            ]}
          />
        </View>

        {/* ✅ 버블용 래퍼: 이 래퍼의 가운데가 게이지 위치 */}
        <View
          style={[
            styles.cardProgressBubbleWrapper,
            { left: `${bubbleLeftPct}%` },
          ]}
        >
          <View style={styles.cardProgressBubble}>
            <Text style={styles.cardProgressBubbleText}>{bubbleText}</Text>
          </View>
          <View style={styles.cardProgressBubbleTail} />
        </View>
      </View>
    </View>
  );
}

function ChallengeProgressSection({
  items,
  onPressDetail,
}: {
  items: ChallengeItem[];
  onPressDetail: (id: string) => void;
}) {
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
              id={c.id}
              category={getOngoingCategoryLabel(c)}
              type={mapDurationTypeToLabel(c.durationType)}
              title={c.title}
              progressRatio={(c.progressPct ?? 0) / 100}
              currentValue={c.currentValue}
              targetValue={c.targetValue}
              unit={c.unit}
              variant={getVariantFromChallengeId(c.id)}
              onPressDetail={() => onPressDetail(c.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ===== 진행중 섹션 전용: 기간 필터 (전체/데일리/위클리/먼슬리) ===== */

/*function OngoingDurationFilterRow({
  value,
  onChange,
}: {
  value: DurationFilter;
  onChange: (v: DurationFilter) => void;
}) {
  const options: DurationFilter[] = ['전체', '데일리', '위클리', '먼슬리'];

  return (
    <View style={styles.ongoingFilterRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.ongoingFilterChip,
            value === opt && styles.ongoingFilterChipActive,
          ]}
          onPress={() => onChange(opt)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.ongoingFilterChipText,
              value === opt && styles.ongoingFilterChipTextActive,
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}*/

/* ===== 추천 섹션 (AI만 사용) ===== */

// challengeId → 추천 카드 이미지 매핑
function getChallengeImage(id: string) {
  switch (id) {
    case 'daily_water_2':
      return require('../../assets/images/water.png');
    case 'monthly_heating':
      return require('../../assets/images/save.png');
    case 'speed_dishwasher':
    default:
      return require('../../assets/images/dishwasher.png');
  }
}

// challengeId → 이미지 스타일 매핑
function getChallengeImageStyle(id: string) {
  switch (id) {
    case 'daily_water_2':
      return styles.waterIcon;
    case 'monthly_heating':
      return styles.heatingIcon;
    case 'speed_dishwasher':
    default:
      return styles.dishwasherIcon;
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
        renderItem={({ item }) => {
          const durationLabel = mapDurationTypeToLabel(item.durationType);
          const timeLabel = formatTimeSlotLabel(item.recommendedTimeSlot);

          return (
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
                <Text style={styles.challengeMetaText}>
                  {item.domainCategory ?? '전체'}
                </Text>
                <View style={styles.metaDivider} />
                <Text style={styles.challengeMetaText}>{durationLabel}</Text>
                <Image
                  source={require('../../assets/images/tdesign_time-filled.png')}
                  style={styles.metaIcon}
                />
                {timeLabel ? (
                  <Text style={styles.challengeMetaText}>{timeLabel}</Text>
                ) : null}
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
            </View>
          );
        }}
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

/* ================== 메인 페이지 ================== */

export function Challenge() {
  const [showDetail, setShowDetail] = useState(false);
  const [activeRecIndex, setActiveRecIndex] = useState(0);
  const [audience, setAudience] = useState<Audience>('나');
  const [durationFilter, _setDurationFilter] = useState<DurationFilter>('전체');

  const [summary, setSummary] = useState({
    me: {
      totalParticipated: 0,
      totalCompleted: 0,
      successRate: 0,
    },
    family: {
      totalParticipated: 0,
      totalCompleted: 0,
      successRate: 0,
    },
  });
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null,
  );

  // AI에서 들어온 추천만 표시
  const [aiRecommended, setAiRecommended] = useState<ChallengeItem[]>([]);
  const [_aiLoading, setAiLoading] = useState(false);

  const { user: appUser } = useAuthStore(); // familyId 용

  const {
    currentFilter,
    setFilter,
    hydrate,
    startChallenge,
    ongoing,
    //completed,
    subscribeRealtimePersonal,
  } = useChallengeStore();

  // 디버그: 현재 로그인한 사용자 정보 출력
  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      console.log('[Challenge] auth.currentUser =', {
        uid: user.uid,
        email: user.email,
      });
    } else {
      console.log('[Challenge] auth.currentUser is NULL');
    }
  }, []);

  // AI 추천 불러오기
  const loadAiRecommended = async () => {
    try {
      setAiLoading(true);
      // 현재는 user_4 고정 (데모용)
      const list = await fetchAiRecommendedChallenges('user_4');
      console.log('[AI] recommended from API =', list);
      setAiRecommended(list);
    } catch (e) {
      console.log('[loadAiRecommended] error:', e);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    console.log('[Challenge] useEffect -> hydrate + subscribeRealtime + AI');
    hydrate(); // 초기 로딩
    subscribeRealtimePersonal(); // 이후부터는 실시간 반영
    loadAiRecommended();
  }, [hydrate, subscribeRealtimePersonal]);

  // 진행중/완료 챌린지를 기준으로 요약 숫자 계산
  // Challenge 컴포넌트 내부

  useEffect(() => {
    const fbUser = auth.currentUser;
    const familyId = appUser?.familyId;

    if (!fbUser) {
      console.log('[Challenge] no auth.currentUser for summary');
      setSummary({
        me: { totalParticipated: 0, totalCompleted: 0, successRate: 0 },
        family: { totalParticipated: 0, totalCompleted: 0, successRate: 0 },
      });
      return;
    }

    console.log(
      '[Challenge] subscribe summary for uid =',
      fbUser.uid,
      'familyId =',
      familyId,
    );

    // 나 요약 실시간 구독
    const unsubMy = challengeService.subscribeMySummary(
      fbUser.uid,
      (meSummary) => {
        setSummary((prev) => ({
          ...prev,
          me: meSummary,
        }));
      },
    );

    // 가족 요약 실시간 구독 (familyId 있을 때만)
    let unsubFamily: (() => void) | undefined;

    if (familyId) {
      unsubFamily = challengeService.subscribeFamilySummary(
        familyId,
        (familySummary) => {
          setSummary((prev) => ({
            ...prev,
            family: familySummary,
          }));
        },
      );
    } else {
      // familyId 없으면 가족은 0으로 초기화
      setSummary((prev) => ({
        ...prev,
        family: { totalParticipated: 0, totalCompleted: 0, successRate: 0 },
      }));
    }

    // cleanup
    return () => {
      unsubMy();
      if (unsubFamily) unsubFamily();
    };
  }, [appUser?.familyId]);

  const onCategoryChange = (filter: Filter) => {
    console.log('📌 onCategoryChange:', filter);
    setFilter(filter);
    hydrate();
  };

  // 진행중 & 추천 공통 필터 (audience + domainCategory)
  const matchesAudienceAndCategory = (c: ChallengeItem) => {
    if (c.category !== audience) return false;
    if (currentFilter === '전체') return true;
    return c.domainCategory === currentFilter;
  };

  // 진행중: audience + 카테고리 + 기간 필터
  const filteredOngoing = ongoing
    .filter((c) => c.status === 'ongoing')
    .filter(matchesAudienceAndCategory)
    .filter((c) => {
      if (durationFilter === '전체') return true;
      if (durationFilter === '데일리') return c.durationType === 'daily';
      if (durationFilter === '위클리') return c.durationType === 'weekly';
      if (durationFilter === '먼슬리') return c.durationType === 'monthly';
      return true;
    });

  // 진행중 챌린지들의 id 집합
  const ongoingIds = new Set(filteredOngoing.map((c) => c.id));

  // 추천: AI 추천 + 진행중과 중복 제거
  const filteredRecommended = aiRecommended
    .filter(matchesAudienceAndCategory)
    .filter((c) => !ongoingIds.has(c.id));

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
      await startChallenge(challengeId);
      await hydrate();
    } catch (e) {
      console.log('[Challenge] startChallenge error:', e);
      Alert.alert(
        '챌린지 시작 오류',
        '챌린지를 시작하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
      );
    }
  };

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

          <MyChallengeSection
            audience={audience}
            mySummary={summary.me}
            familySummary={summary.family}
          />

          <ChallengeProgressSection
            items={filteredOngoing}
            onPressDetail={(id) => {
              setSelectedChallengeId(id);
              setShowDetail(true);
            }}
          />

          <RecommendedChallengeSection
            items={filteredRecommended}
            onPressStart={handlePressStart}
            onIndexChange={setActiveRecIndex}
            onDismiss={(id) => {
              setAiRecommended((prev) => prev.filter((c) => c.id !== id));
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

      {showDetail && selectedChallengeId && (
        <View style={styles.detailSheetWrapper}>
          <ChallengeDetail
            onClose={() => setShowDetail(false)}
            challengeId={selectedChallengeId}
            from="ongoing"
            audience={audience}
            category={currentFilter}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ================== 스타일 ================== */

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
    paddingHorizontal: 30,
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
  progressSectionTitle: {
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

  /* 진행중 기간 필터 */
  ongoingFilterRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginLeft: 6,
  },
  ongoingFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F4F4F4',
    marginRight: 8,
  },
  ongoingFilterChipActive: {
    backgroundColor: '#353535',
  },
  ongoingFilterChipText: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: '#7B7B7B',
  },
  ongoingFilterChipTextActive: {
    color: '#FFFFFF',
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
    width: 170,
    height: 108,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
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
  metaDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#7B7B7B',
    marginHorizontal: 4,
  },
  chevronIcon: {
    width: 15,
    height: 15,
    tintColor: '#7B7B7B',
    resizeMode: 'contain',
  },
  challengeTitle: {
    fontSize: 13,
    color: '#353535',
    marginBottom: 22,
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },

  progressBarContainer: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 8,
    position: 'relative',
  },
  progressBarBg: {
    height: 9,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#F6F6F6',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#5E75FD',
  },
  cardProgressBubbleWrapper: {
    position: 'absolute',
    bottom: 12, // 게이지 위로 띄우는 높이
    alignItems: 'center',
    transform: [{ translateX: -24 }],
  },

  cardProgressBubble: {
    backgroundColor: '#5E75FD',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 19,
  },
  cardProgressBubbleText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 9,
  },
  cardProgressBubbleTail: {
    marginTop: -1,
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#5E75FD',
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
    zIndex: 10,
  },
  deleteIcon: {
    width: 11,
    height: 11,
    tintColor: '#7B7B7B',
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
    marginHorizontal: 4,
    resizeMode: 'contain',
    tintColor: '#7B7B7B',
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
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#8C8C8C',
  },
  dotInactive: {
    backgroundColor: '#E0E0E0',
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

  detailSheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 1,
    alignItems: 'center',
  },
});

export default Challenge;
