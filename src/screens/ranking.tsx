// src/screens/Ranking.tsx
import { router } from 'expo-router';
import { doc, updateDoc, increment } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  RankingList,
  RankingRow as RankingListRow,
} from '../components/RankingList';
import { db } from '../firebase/firebase';
import { rankingService } from '../services/rankingService';

/* ========== 공통 로깅 함수 ========== */
function logRankingEvent(event: string, payload?: any) {
  if (payload !== undefined) {
    console.log('[Ranking]', event, payload);
  } else {
    console.log('[Ranking]', event);
  }
}

/* ========== 헤더 ========== */
function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerLogo}>HomeQuest</Text>

      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => {
          logRankingEvent('press_setting');
          router.push('/Setting');
        }}
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

/* ========== 내 랭킹 카드 ========== */

type MyRankingCardProps = {
  familyName: string;
  rank: number | null;
};

function MyRankingCard({ familyName, rank }: MyRankingCardProps) {
  const rankText = rank != null ? `${rank}위` : '-위';

  return (
    <View style={styles.myRankingCard}>
      <View style={styles.myRankingLeft}>
        <Text style={styles.myRankingLabel}>내 랭킹</Text>
      </View>

      <View style={styles.myRankingDivider} />

      <View style={styles.myRankingRight}>
        <Text style={styles.myRankingLine1}>
          <Text style={styles.myRankingName}>{familyName}</Text>
          <Text style={styles.myRankingSub}> 님의 랭킹은</Text>
        </Text>

        <Text style={styles.myRankingLine2}>
          <Text style={styles.myRankingNumber}>{rankText}</Text>
          <Text style={styles.myRankingSub}> 입니다</Text>
        </Text>
      </View>
    </View>
  );
}

/* ========== 상단 기간/지역 ========== */

type RankingInfoProps = {
  onPressInfo: (pos: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
};

function RankingInfo({ onPressInfo }: RankingInfoProps) {
  const infoRef = useRef<View | null>(null);

  const handlePress = () => {
    infoRef.current?.measureInWindow((x, y, width, height) => {
      onPressInfo({ x, y, width, height });
    });
  };

  return (
    <View style={styles.rankingInfo}>
      <View style={styles.rankingPeriodRow}>
        <Text style={styles.rankingPeriodText}>
          10.1~10.31 | 총 529명 참석중
        </Text>
      </View>

      <View style={styles.rankingLocationRow}>
        <Text style={styles.rankingLocationText}>서울시 성동구 행당동</Text>
        <TouchableOpacity
          ref={infoRef}
          style={styles.infoTooltipButton}
          onPress={handlePress}
        >
          <Image
            source={require('../../assets/images/si_help-fill.png')}
            style={styles.infoTooltipIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ========== 랜덤 박스 ========== */

type RandomBoxProps = {
  onPress: () => void;
  // 0 ~ 1 사이의 진행도
  progress: Animated.Value;
  // 랭킹 상승 시 잠깐 보여줄 텍스트 (예: "+1")
  gainText?: string | null;
  gainAnim?: Animated.Value;
};

function RandomBox({ onPress, progress, gainText, gainAnim }: RandomBoxProps) {
  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const gainOpacity = gainAnim
    ? gainAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      })
    : 0;

  const gainTranslateY = gainAnim
    ? gainAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -12],
      })
    : 0;

  return (
    <TouchableOpacity style={styles.randomBox} onPress={onPress}>
      <Image
        source={require('../../assets/images/RandomBox.png')}
        style={styles.randomBoxImage}
      />

      <View style={styles.randomGauge}>
        <Animated.View style={[styles.randomGaugeFill, { width: fillWidth }]} />
      </View>

      {gainText && gainAnim && (
        <Animated.Text
          style={[
            styles.randomGainText,
            {
              opacity: gainOpacity,
              transform: [{ translateY: gainTranslateY }],
            },
          ]}
        >
          {gainText}
        </Animated.Text>
      )}
    </TouchableOpacity>
  );
}

/* ========== 보상 모달 ========== */

type RewardModalProps = {
  point: number;
  onClose: () => void;
};

function RewardModal({ point, onClose }: RewardModalProps) {
  return (
    <View style={styles.rewardBackdrop}>
      <View style={styles.rewardCard}>
        <Text style={styles.rewardTitle}>축하합니다!</Text>
        <Text style={styles.rewardPoint}>+{point}p</Text>

        <Image
          source={require('../../assets/images/BoxOpen.png')}
          style={styles.rewardImage}
          resizeMode="contain"
        />

        <TouchableOpacity style={styles.rewardButton} onPress={onClose}>
          <Text style={styles.rewardButtonText}>확인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ========== 상위 3등 카드 ========== */

type TopPlaceProps = {
  place: 1 | 2 | 3;
  familyName: string;
  scoreText: string;
  rank: number;
  prevRank: number;
  onPress?: () => void;
  sharedAnim?: Animated.Value;
};

function TopPlaceCard({
  place,
  familyName,
  scoreText,
  rank,
  prevRank,
  onPress,
  sharedAnim,
}: TopPlaceProps) {
  const medalSource =
    place === 1
      ? require('../../assets/images/MedalIcon1.png')
      : place === 2
        ? require('../../assets/images/MedalIcon2.png')
        : require('../../assets/images/MedalIcon3.png');

  const change: 'none' | 'up' | 'down' =
    prevRank > rank ? 'up' : prevRank < rank ? 'down' : 'none';

  const statusText =
    change === 'up'
      ? `${prevRank - rank}위상승`
      : change === 'down'
        ? `${rank - prevRank}위하락`
        : '-';

  const statusIconSource =
    change === 'up'
      ? require('../../assets/images/up.png')
      : change === 'down'
        ? require('../../assets/images/down.png')
        : null;

  return (
    <TouchableOpacity
      style={styles.topCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.topCardFrame} />

      <BlinkImage
        source={medalSource}
        style={styles.medalIcon}
        sharedAnim={sharedAnim}
      />

      <Text style={styles.topFamilyName}>{familyName}</Text>
      <Text style={styles.topScoreText}>{scoreText}</Text>

      <View style={styles.topStatusBadge}>
        <Text style={styles.topStatusText}>{statusText}</Text>
        {statusIconSource && (
          <Image source={statusIconSource} style={styles.topStatusIcon} />
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ========== 반짝이는 효과 ========== */

function useBlink(options?: {
  sharedAnim?: Animated.Value;
  duration?: number;
  minOpacity?: number;
  maxOpacity?: number;
  minScale?: number;
  maxScale?: number;
}) {
  const {
    sharedAnim,
    duration = 900,
    minOpacity = 0.35,
    maxOpacity = 1,
    minScale = 1,
    maxScale = 1.12,
  } = options || {};

  const localAnim = useRef(new Animated.Value(0)).current;
  const anim = sharedAnim ?? localAnim;

  useEffect(() => {
    if (sharedAnim) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(localAnim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(localAnim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [sharedAnim, localAnim, duration]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [minOpacity, maxOpacity],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [minScale, maxScale],
  });

  return { opacity, scale };
}

function BlinkImage({
  source,
  style,
  duration,
  sharedAnim,
}: {
  source: any;
  style?: any;
  duration?: number;
  sharedAnim?: Animated.Value;
}) {
  const { opacity, scale } = useBlink({ duration, sharedAnim });
  return (
    <Animated.Image
      source={source}
      style={[style, { opacity, transform: [{ scale }] }]}
      resizeMode="contain"
    />
  );
}

/* ========== 랭킹 데이터 타입 ========== */

type RankingRaw = {
  id: string;
  familyName: string;
  score: number;
};

type RankingRow = RankingRaw & {
  rank: number;
  prevRank: number;
};

function computeRanks(
  raw: RankingRaw[],
  prevMap?: Record<string, number>,
): RankingRow[] {
  const sorted = [...raw].sort((a, b) => b.score - a.score);
  return sorted.map((r, i) => {
    const newRank = i + 1;
    const prevRank = prevMap?.[r.id] ?? newRank;
    return { ...r, rank: newRank, prevRank };
  });
}

/* ========== 하단 탭 바 ========== */

function BottomTabBar() {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.7}
        onPress={() => {
          logRankingEvent('tab_click', 'Home');
          router.push('/');
        }}
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
          logRankingEvent('tab_click', 'Challenge');
          router.push('/two');
        }}
      >
        <Image
          source={require('../../assets/images/challenge_.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.7}
        onPress={() => {
          logRankingEvent('tab_click', 'Reward');
          router.push('/three');
        }}
      >
        <Image
          source={require('../../assets/images/reward.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.7}
        onPress={() => {
          logRankingEvent('tab_click', 'Ranking');
        }}
      >
        <Image
          source={require('../../assets/images/ranking_.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

/* ========== 메인 컴포넌트 ========== */

export function Ranking() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [showReward, setShowReward] = useState(false);
  const [rows, setRows] = useState<RankingListRow[]>([]);

  const [highlightedFamilies, setHighlightedFamilies] = useState<
    Record<string, 'up' | 'down'>
  >({});

  // 최근에 부스터가 점수 올린 가족들(id만 저장)
  const boostedIdsRef = useRef<Record<string, boolean>>({});

  const rowsRef = useRef<RankingRow[]>([]);

  const sharedBlink = useRef(new Animated.Value(0)).current;

  const myFamilyId = 'fam_jinjin';
  const myRow = rows.find((r) => r.id === myFamilyId);

  // 추가: 상자깡 게이지 진행도 (0 ~ 1)
  const [boxProgress, setBoxProgress] = useState(0);
  const boxProgressAnim = useRef(new Animated.Value(0)).current;

  // 추가: 내 이전 랭킹 저장용
  const prevMyRankRef = useRef<number | null>(null);

  // 추가: +1 텍스트용 상태/애니메이션
  const [gainText, setGainText] = useState<string | null>(null);
  const gainAnim = useRef(new Animated.Value(0)).current;

  // boxProgress 상태를 Animated.Value로 부드럽게 반영
  useEffect(() => {
    Animated.timing(boxProgressAnim, {
      toValue: boxProgress,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // width 애니메이션이라 false
    }).start();
  }, [boxProgress, boxProgressAnim]);

  const triggerRankGain = useCallback(
    (diff: number) => {
      if (diff <= 0) return;

      const text = diff === 1 ? '+1' : `+${diff}`;
      setGainText(text);

      gainAnim.setValue(0);
      Animated.timing(gainAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setGainText(null);
      });
    },
    [gainAnim],
  );

  // rows 변경 시 내 랭킹 변화 감지 → 랭킹 오르면 게이지/텍스트 업데이트
  useEffect(() => {
    const currentMyRow = rows.find((r) => r.id === myFamilyId);
    if (!currentMyRow) return;

    const prevRank = prevMyRankRef.current;
    const currentRank = currentMyRow.rank;

    if (prevRank != null && currentRank < prevRank) {
      // 랭킹이 올랐을 때 (예: 5위 → 4위)
      const diff = prevRank - currentRank;

      // 게이지 조금씩 차오르게 (랭킹 1칸 당 0.1씩 증가 예시)
      setBoxProgress((prev) => {
        const next = Math.min(prev + 0.3 * diff, 1);

        // 게이지가 막 꽉 찬 순간
        if (prev < 1 && next >= 1) {
          console.log('[Ranking] 게이지 100% 도달 → 자동 상자깡!');
          // 자동으로 보상 모달 열기
          setShowReward(true);

          if (prev < 1 && next >= 1) {
            setShowReward(true);

            // 게이지 자동 초기화
            setTimeout(() => {
              setBoxProgress(0);
            }, 300); // 모달 표시 직후 약간 딜레이 주는 게 깔끔함
          }
        }

        return next;
      });

      // +1 텍스트 애니메이션
      triggerRankGain(diff);
    }

    // 현재 랭킹을 다음 비교를 위해 저장
    prevMyRankRef.current = currentRank;
  }, [rows, myFamilyId, triggerRankGain]);

  // rows가 바뀔 때마다 ref에도 최신값 저장
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // 메달 반짝임
  useEffect(() => {
    logRankingEvent('screen_view');

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sharedBlink, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sharedBlink, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sharedBlink]);

  // Firestore → rows 반영 + 하이라이트 결정
  const applyBackendScores = useCallback((newRaw: RankingRaw[]) => {
    // 직전 렌더의 rows (rowsRef에서 가져옴)
    const prevRows = rowsRef.current;

    // 이전 rank 맵
    const prevRankMap: Record<string, number> = {};
    prevRows.forEach((p) => {
      prevRankMap[p.id] = p.rank;
    });

    // 새 랭킹 계산
    const next = computeRanks(newRaw, prevRankMap);

    const highlights: Record<string, 'up' | 'down'> = {};

    // 1) 부스터가 올린 가족들 먼저 처리
    const boostedIds = Object.keys(boostedIdsRef.current);

    if (boostedIds.length > 0) {
      boostedIds.forEach((id) => {
        const before = prevRankMap[id];
        const row = next.find((r) => r.id === id);
        if (!row || before == null) return;

        const after = row.rank;
        if (before === after) return;

        highlights[id] = after < before ? 'up' : 'down';
      });

      // 한 번 처리한 부스터 정보는 비우기
      boostedIdsRef.current = {};
    } else {
      // 2) 부스터 정보가 없을 때: 기본 랭킹 변화 기반 하이라이트 (fallback)
      next.forEach((row) => {
        const before = prevRankMap[row.id] ?? row.rank;
        const after = row.rank;

        if (before === after) return;

        const diff = before - after; // +면 위로, -면 아래로
        // 이동 거리가 너무 크면 무시 (1~2칸만 하이라이트)
        if (Math.abs(diff) <= 3) {
          highlights[row.id] = diff > 0 ? 'up' : 'down';
        }
      });
    }

    // 확정된 하이라이트 적용
    setHighlightedFamilies(highlights);
    setRows(next);
  }, []);

  // Ranking 컴포넌트 안

  const isInitialLoadRef = useRef(true); // 첫 스냅샷은 그냥 고정 화면용

  useEffect(() => {
    console.log('[Ranking] subscribeFamiliesRanking with reset start');

    let unsubscribe: (() => void) | null = null;

    // dev에서만 실행할 초기화 함수 (네가 올린 코드 그대로)
    const resetFamilies = async () => {
      const defaults: Record<string, number> = {
        fam_002: 1000,
        fam_003: 1120,
        fam_004: 1230,
        fam_005: 1350,
        fam_006: 1470,
        fam_007: 1690,
        fam_008: 1810,
        fam_009: 1940,
        fam_010: 2000,
        fam_jinjin: 900,
      };

      for (const [id, score] of Object.entries(defaults)) {
        const ref = doc(db, 'families', id);
        await updateDoc(ref, { totalFamilyPoints: score });
      }
    };

    const init = async () => {
      // 1) dev 모드면 먼저 초기화 끝내고
      if (__DEV__) {
        try {
          console.log('[Ranking] resetFamilies start');
          await resetFamilies();
          console.log('[Ranking] resetFamilies done');
        } catch (e) {
          console.log('[Ranking] resetFamilies error', e);
        }
      }

      // 2) 그 다음에 구독 시작
      unsubscribe = rankingService.subscribeFamiliesRanking((families) => {
        const newRaw: RankingRaw[] = families.map((f) => ({
          id: f.id,
          familyName: f.familyName,
          score: f.totalFamilyPoints,
        }));

        console.log('[Ranking] families from Firestore =', newRaw);

        // 첫 스냅샷은 "그냥 정렬된 화면"만 보여주고, 애니메이션/랭킹변화 로직은 건너뛴다
        if (isInitialLoadRef.current) {
          const initialRows = computeRanks(newRaw); // prevRank 없이 깔끔 정렬
          setRows(initialRows);
          isInitialLoadRef.current = false;
          return;
        }

        // 그 다음부터는 기존 로직대로 (prevRank 이용하는 애니메이션 포함)
        applyBackendScores(newRaw);
      });
    };

    init();

    return () => {
      console.log('[Ranking] unsubscribe ranking');
      if (unsubscribe) unsubscribe();
    };
  }, [applyBackendScores]);

  // 랜덤 가족 랭킹변화 로직
  useEffect(() => {
    if (!__DEV__) return;

    const intervalId = setInterval(async () => {
      const list = rowsRef.current;
      if (!list || list.length === 0) return;

      const randomIndex = Math.floor(Math.random() * list.length);
      const target = list[randomIndex];
      if (!target?.id) return;

      // 부스터가 올린 가족 id 기록
      boostedIdsRef.current[target.id] = true;

      try {
        const familyRef = doc(db, 'families', target.id);
        await updateDoc(familyRef, {
          totalFamilyPoints: increment(200), // 1초짜리면 200
        });
      } catch (e) {
        console.log('[DevBoost] fast booster error', e);
      }
    }, 700);

    return () => clearInterval(intervalId);
  }, []);

  console.log(
    'rows in UI >>>',
    rows.map((r) => ({
      id: r.id,
      name: r.familyName,
      score: r.score,
      rank: r.rank,
      prevRank: r.prevRank,
    })),
  );
  // 랭킹변화 로직
  useEffect(() => {
    if (!__DEV__) return;

    console.log('[DevBoost] start fast booster (1.5s)');

    const intervalId = setInterval(async () => {
      const list = rowsRef.current;
      if (!list || list.length === 0) return;

      const randomIndex = Math.floor(Math.random() * list.length);
      const target = list[randomIndex];
      if (!target?.id) return;

      // 부스터가 올린 가족 id 기록
      boostedIdsRef.current[target.id] = true;

      try {
        const familyRef = doc(db, 'families', target.id);
        await updateDoc(familyRef, {
          totalFamilyPoints: increment(100),
        });

        console.log(
          '[DevBoost] [FAST] +100 to',
          target.familyName,
          `(id: ${target.id})`,
        );
      } catch (e) {
        console.log('[DevBoost] fast booster error', e);
      }
    }, 700); // 1.5초

    return () => {
      clearInterval(intervalId);
      console.log('[DevBoost] stop fast booster');
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.main}>
          <MyRankingCard
            familyName={myRow ? myRow.familyName : '잠안자고홈퀘'}
            rank={myRow ? myRow.rank : null}
          />

          <View style={styles.infoRow}>
            <RankingInfo
              onPressInfo={(pos) => {
                logRankingEvent('info_press', pos);
                setTooltipPos(pos);
                setShowTooltip(true);
              }}
            />
            <RandomBox
              onPress={() => setShowReward(true)}
              progress={boxProgressAnim}
              gainText={gainText}
              gainAnim={gainAnim}
            />
          </View>

          <View style={styles.top3Row}>
            {(() => {
              const first = rows.find((r) => r.rank === 1);
              const second = rows.find((r) => r.rank === 2);
              const third = rows.find((r) => r.rank === 3);

              return (
                <>
                  <View style={styles.secondPlaceWrapper}>
                    {second && (
                      <TopPlaceCard
                        key={second.id}
                        place={2}
                        familyName={second.familyName}
                        scoreText={`+${second.score.toLocaleString()}p`}
                        rank={second.rank}
                        prevRank={second.prevRank}
                        sharedAnim={sharedBlink}
                        onPress={() =>
                          logRankingEvent('top_place_press', {
                            place: 2,
                            family: second.familyName,
                            rank: second.rank,
                            prevRank: second.prevRank,
                          })
                        }
                      />
                    )}
                  </View>

                  <View style={styles.firstPlaceWrapper}>
                    {first && (
                      <TopPlaceCard
                        key={first.id}
                        place={1}
                        familyName={first.familyName}
                        scoreText={`+${first.score.toLocaleString()}p`}
                        rank={first.rank}
                        prevRank={first.prevRank}
                        sharedAnim={sharedBlink}
                        onPress={() =>
                          logRankingEvent('top_place_press', {
                            place: 1,
                            family: first.familyName,
                            rank: first.rank,
                            prevRank: first.prevRank,
                          })
                        }
                      />
                    )}
                  </View>

                  <View style={styles.thirdPlaceWrapper}>
                    {third && (
                      <TopPlaceCard
                        key={third.id}
                        place={3}
                        familyName={third.familyName}
                        scoreText={`+${third.score.toLocaleString()}p`}
                        rank={third.rank}
                        prevRank={third.prevRank}
                        sharedAnim={sharedBlink}
                        onPress={() =>
                          logRankingEvent('top_place_press', {
                            place: 3,
                            family: third.familyName,
                            rank: third.rank,
                            prevRank: third.prevRank,
                          })
                        }
                      />
                    )}
                  </View>
                </>
              );
            })()}
          </View>

          <RankingList
            rows={rows}
            highlightedFamilies={highlightedFamilies}
            onPressRow={(row) => logRankingEvent('rank_row_press', row)}
          />
        </View>
      </ScrollView>

      {showTooltip && tooltipPos && (
        <View style={styles.tooltipBackdrop}>
          <View
            style={[
              styles.tooltipArrow,
              {
                top: tooltipPos.y + 30,
                left: tooltipPos.x + tooltipPos.width / 2 - 13,
              },
            ]}
          />

          <View
            style={[
              styles.tooltipBox,
              {
                top: tooltipPos.y + 40,
                left: 20,
                right: 20,
              },
            ]}
          >
            <Text style={styles.tooltipText}>
              매월 1일, 랭킹이 갱신됩니다!{'\n'}매 시즌 랭킹은 같은 동에
              거주하는 가족들끼리 경쟁해요.{'\n\n'}
              랭킹이 오를수록 오른쪽 상단의 🎁상자깡 확률이 높아지고, 상자
              안에는 할인쿠폰, 포인트 등 랜덤 선물이 들어 있습니다.
            </Text>

            <TouchableOpacity
              style={styles.tooltipCloseButton}
              onPress={() => {
                logRankingEvent('tooltip_close');
                setShowTooltip(false);
              }}
            >
              <Text style={styles.tooltipCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showReward && (
        <RewardModal point={300} onClose={() => setShowReward(false)} />
      )}

      <BottomTabBar />
    </SafeAreaView>
  );
}

export default Ranking;

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
    paddingHorizontal: 30, // 컨텐츠용 패딩
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

  /* 내 랭킹 카드 */
  myRankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 37,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
    marginTop: 20,
  },
  myRankingLeft: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 29,
  },
  myRankingLabel: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  myRankingDivider: {
    width: 1,
    height: 65,
    backgroundColor: '#A0A0A0',
    marginRight: 29,
  },
  myRankingRight: {
    flex: 1,
  },
  myRankingLine1: {
    fontSize: 14,
    fontFamily: 'Roboto',
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '500',
  },
  myRankingLine2: {
    textAlign: 'center',
  },
  myRankingName: {
    color: '#000000',
    fontWeight: '400',
  },
  myRankingSub: {
    fontSize: 14,
    color: '#A0A0A0',
    fontFamily: 'Roboto',
    fontWeight: '400',
  },
  myRankingNumber: {
    fontSize: 20,
    fontFamily: 'Roboto',
    fontWeight: '500',
    color: '#FF4D4D',
  },

  /* 랭킹 정보 (기간 / 지역) */
  rankingInfo: {
    flex: 1,
  },
  rankingPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    paddingHorizontal: 0,
  },
  rankingPeriodText: {
    fontSize: 13,
    color: '#A0A0A0',
    fontFamily: 'Roboto',
  },
  rankingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingLocationText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Roboto',
    fontWeight: '700',
    marginRight: 6,
  },
  infoTooltipButton: {
    width: 22,
    height: 22,
  },
  infoTooltipIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  /* 랜덤 박스 */
  randomBox: {
    alignItems: 'center',
    marginLeft: 12,
  },
  randomBoxImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: 3,
  },
  randomGauge: {
    width: 40,
    height: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  randomGaugeFill: {
    height: '100%',
    backgroundColor: '#474747',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  randomGainText: {
    position: 'absolute',
    bottom: 6, // 게이지 바로 위 정도
    right: 18,
    fontSize: 11,
    color: '#9B9B9B',
    fontWeight: '500',
  },

  /* 상위 3등 카드 */
  top3Row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -2,
    alignItems: 'flex-end', // 아래 기준으로 정렬
  },
  firstPlaceWrapper: {
    marginBottom: 40, // 1등 제일 높게
  },
  secondPlaceWrapper: {
    marginBottom: 20, // 2등 중간
  },
  thirdPlaceWrapper: {
    marginBottom: 0, // 3등 제일 낮게
  },
  topCard: {
    width: 103,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  topCardFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#D0D0D0',
  },
  medalIcon: {
    position: 'absolute',
    top: -6,
    width: 100,
    height: 110,
    resizeMode: 'contain',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  medalGlowInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFD54A', // 노란 글로우
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },
  topFamilyName: {
    marginTop: 50,
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  topScoreText: {
    marginTop: 4,
    fontSize: 12,
    color: '#FF4D4F',
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  topStatusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  topStatusText: {
    fontSize: 11,
    color: '#000000',
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  topStatusIcon: {
    width: 11,
    height: 11,
    marginLeft: 4,
    resizeMode: 'contain',
  },

  /* 툴팁 오버레이 */
  tooltipBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 9999, // iOS
    elevation: 9999, // Android
  },
  tooltipArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#353535',
  },
  tooltipBox: {
    position: 'absolute',
    backgroundColor: '#353535',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  tooltipText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
  },
  tooltipCloseButton: {
    position: 'absolute',
    top: 8,
    right: 10,
    padding: 6,
  },
  tooltipCloseText: {
    fontSize: 18,
    color: '#FFFFFF',
  },

  /* 하단 탭바 */
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 75,

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

  rewardBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // iOS
    elevation: 9999, // Android
  },
  rewardCard: {
    width: 280,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 18,
    color: '#222222',
    marginBottom: 4,
  },
  rewardPoint: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  rewardImage: {
    width: 250,
    height: 180,
    marginBottom: 15,
  },
  rewardButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
