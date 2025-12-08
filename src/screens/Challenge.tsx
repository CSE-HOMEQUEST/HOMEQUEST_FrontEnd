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

type CategoryFilterGroupProps = {
  audience: Audience;
  category: Filter; // '전체' | '절약' | '가사' | '헬스'
  onAudienceChange: (value: Audience) => void;
  onCategoryChange: (value: Filter) => void;
};

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
      // 14:00 같은 포맷은 일단 그대로 노출
      return timeSlot;
  }
};

const formatProgressBadge = (c: ChallengeItem): string => {
  const cur = c.currentValue ?? 0;
  const target = c.targetValue ?? 0;
  const unit = c.unit ?? '';

  if (!target) {
    return unit ? `${cur}${unit}` : `${cur}`;
  }
  return unit ? `${cur}/${target}${unit}` : `${cur}/${target}`;
};

// 추천/진행 카드용 챌린지 이미지 매퍼
const getChallengeImageSource = (c: ChallengeItem) => {
  const domain = c.domainCategory; // '절약' | '가사' | '헬스' | ...
  const deviceType = c.deviceType; // store에 위에서 추가한 필드

  if (domain === '헬스') {
    return require('../../assets/images/water.png');
  }

  if (domain === '절약') {
    return require('../../assets/images/save.png');
  }

  if (domain === '가사') {
    if (deviceType === 'robot_cleaner') {
      return require('../../assets/images/Robot.png');
    }
    if (deviceType === 'dishwasher') {
      return require('../../assets/images/dishwasher.png');
    }
    return require('../../assets/images/dishwasher.png');
  }

  return require('../../assets/images/dishwasher.png');
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
  const titleText = isMe ? '나의 챌린지 현황' : '우리 가족 챌린지 현황';

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

function ChallengeCardv2({
  category,
  type,
  title,
  badgeText,
  progressRatio,
  onPressDetail,
}: {
  category: string;
  type: string;
  title: string;
  badgeText: string;
  progressRatio: number;
  onPressDetail?: () => void;
}) {
  const hasProgress = progressRatio > 0;
  const [barWidth, setBarWidth] = useState(0);
  const [isTitleMultiLine, setIsTitleMultiLine] = useState(false);

  const clampedRatio = Math.max(0, Math.min(progressRatio, 1));
  const bubbleWidth = 60; // 말풍선 대략 가로
  const bubbleCenter = barWidth * clampedRatio;
  const bubbleLeftRaw = bubbleCenter - bubbleWidth / 2;
  const bubbleLeft = Math.min(
    Math.max(bubbleLeftRaw, 0),
    Math.max(barWidth - bubbleWidth, 0),
  );

  return (
    <View style={styles.challengeCard}>
      <View style={styles.challengeCardHeader}>
        {/* 카테고리(절약/가사/헬스) | duration */}
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

      <Text
        style={styles.challengeTitle}
        numberOfLines={2}
        ellipsizeMode="tail"
        onTextLayout={(e) => {
          const lineCount = e.nativeEvent.lines.length;
          console.log('[ChallengeCardv2] title lineCount =', lineCount, title);
          if (lineCount > 1 && !isTitleMultiLine) {
            setIsTitleMultiLine(true);
          }
        }}
      >
        {title}
      </Text>

      {/* 바 + 말풍선 같이 정렬 */}
      <View
        style={[
          styles.progressContainer,
          isTitleMultiLine && styles.progressContainerTight,
        ]}
      >
        <View
          style={styles.progressBarBg}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        >
          {hasProgress && (
            <View
              style={[
                styles.progressBarFill,
                { width: barWidth * clampedRatio },
              ]}
            />
          )}
        </View>

        {/* 게이지가 0이어도, barWidth만 잡히면 말풍선은 항상 보이게 */}
        {barWidth > 0 && (
          <View style={[styles.progressBubble, { left: bubbleLeft }]}>
            <View style={styles.badge2}>
              <Text style={styles.badgeText2}>{badgeText}</Text>
            </View>
            <Image
              source={require('../../assets/images/Polygon2.png')}
              style={styles.badgeTriangle2}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function ChallengeProgressSection({
  items,
  onPressRelayDetail,
}: {
  items: ChallengeItem[];
  onPressRelayDetail: (challenge: ChallengeItem) => void;
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
          items.map((c) => {
            const cur = c.currentValue ?? 0;
            const target = c.targetValue ?? 0;
            const ratio = target > 0 ? cur / target : 0;

            return (
              <ChallengeCardv2
                key={`${c.id}-${c.progressId ?? 'no-progress'}-${c.status}`}
                category={c.domainCategory ?? '전체'}
                type={mapDurationTypeToLabel(c.durationType)}
                title={c.title}
                badgeText={formatProgressBadge(c)}
                progressRatio={Math.max(0, Math.min(ratio, 1))}
                onPressDetail={() => onPressRelayDetail(c)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

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
        keyExtractor={(item) => item.id}
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
                {/* 왼쪽: 카테고리 | 데일리 */}
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
                  source={getChallengeImageSource(item)}
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

// 메인 페이지
export function Challenge() {
  const [showDetail, setShowDetail] = useState(false);
  const [activeRecIndex, setActiveRecIndex] = useState(0);
  const [audience, setAudience] = useState<Audience>('나');

  const [selectedChallenge, setSelectedChallenge] =
    useState<ChallengeItem | null>(null);
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

  const { user: appUser } = useAuthStore(); // familyId 용

  const {
    currentFilter,
    setFilter,
    hydrate,
    startChallenge,
    ongoing,
    recommended,
    dismissRecommendation,
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

  useEffect(() => {
    console.log('[Challenge] useEffect -> call hydrate()');
    hydrate();
  }, [hydrate]);

  // 디버그: 스토어 상태 출력
  useEffect(() => {
    console.log('🟢 [Challenge] store snapshot');
    console.log('ongoing length =', ongoing.length);
    // console.log('ongoing =', ongoing);
    console.log('recommended length =', recommended.length);
    // console.log('recommended =', recommended);
  }, [ongoing, recommended]);

  const onCategoryChange = (filter: Filter) => {
    console.log('📌 onCategoryChange:', filter);
    setFilter(filter);
    hydrate();
  };

  // AI 리포트 디버그: currentUser 기준으로 한 번 호출
  useEffect(() => {
    const run = async () => {
      const fbUser = auth.currentUser;

      if (!fbUser) {
        console.log('[AI REPORT] no auth.currentUser, skip');
        return;
      }

      console.log('[AI REPORT] start for uid =', fbUser.uid);

      // 필요하면 특정 날짜로 고정해서 테스트 가능
      // const baseDate = new Date('2025-12-08T00:00:00+09:00');
      const baseDate = new Date();

      try {
        const report = await challengeService.getWeeklyAiReportData(baseDate);

        console.log('[AI REPORT DEBUG]', JSON.stringify(report, null, 2));
      } catch (e) {
        console.error('[AI REPORT DEBUG ERROR]', e);
      }
    };

    run();
  }, []);

  // 나 & 우리 가족 챌린지 요약 통계 로드
  useEffect(() => {
    const fbUser = auth.currentUser;
    const familyId = appUser?.familyId;

    if (!fbUser) {
      console.log('[Challenge] no auth.currentUser, skip summary');
      return;
    }

    (async () => {
      try {
        const me = await challengeService.getMySummary(fbUser.uid);

        let family = {
          totalParticipated: 0,
          totalCompleted: 0,
          successRate: 0,
        };

        if (familyId) {
          family = await challengeService.getFamilySummary(familyId);
        } else {
          console.log('[Challenge] no familyId, skip family summary');
        }

        setSummary({ me, family });
      } catch (e) {
        console.log('[Challenge] get summary ERROR:', e);
      }
    })();
  }, [appUser?.familyId]);

  // 1) 진행중: audience + currentFilter 둘 다 적용
  const filteredOngoing = ongoing.filter((c) => {
    // 나/가족
    if (c.category !== audience) return false;

    // 전체면 카테고리 필터 패스
    if (currentFilter === '전체') return true;

    // 절약/가사/헬스 비교
    return c.domainCategory === currentFilter;
  });

  // 2) 추천: audience + currentFilter 둘 다 적용
  const filteredRecommended = recommended.filter((c) => {
    if (c.category !== audience) return false;
    if (currentFilter === '전체') return true;
    return c.domainCategory === currentFilter;
  });

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
            onPressRelayDetail={(challenge) => {
              setSelectedChallenge(challenge); // 어떤 챌린지인지 기억
              setShowDetail(true);
            }}
          />

          <RecommendedChallengeSection
            items={filteredRecommended}
            onPressStart={startChallenge}
            onIndexChange={setActiveRecIndex}
            onDismiss={dismissRecommendation}
            onRefresh={hydrate}
          />
        </View>
      </ScrollView>
      <PageIndicatorDots
        activeIndex={activeRecIndex}
        total={filteredRecommended.length}
      />
      <BottomTabBar />

      {showDetail && selectedChallenge && (
        <View style={styles.detailSheetWrapper}>
          <ChallengeDetail
            onClose={() => setShowDetail(false)}
            challengeId={selectedChallenge.id}
            from="ongoing"
            audience={audience}
            category={currentFilter}
          />
        </View>
      )}
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
    width: 170,
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
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
    height: 32,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  progressContainerTight: {
    marginTop: -5, // 값 조정해서 맞추기
  },

  progressBarBg: {
    width: '86%',
    alignSelf: 'center',
    height: 9,
    borderRadius: 10,
    backgroundColor: '#F6F6F6',
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#5E75FD',
  },

  progressBubble: {
    position: 'absolute',
    bottom: 9 + 4, // 바 위로 살짝 띄우기
    width: 80,
    alignItems: 'center',
    marginLeft: -15,
  },

  badge2: {
    backgroundColor: '#5E75FD',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  badgeTriangle2: {
    width: 10,
    height: 8,
    marginTop: -1,
    resizeMode: 'contain',
  },

  badgeText2: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
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
    width: 38,
    height: 43,
    resizeMode: 'contain',
    marginRight: 30,
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

  detailSheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 1, // 탭바 위
    alignItems: 'center',
  },
});

export default Challenge;
