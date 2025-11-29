// src/screens/Ranking.tsx
import { router } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

import { db } from '../firebase/firebase';
import { rankingService } from '../services/rankingService';

const rankingSwapLayout = {
  duration: 750, // 전체 애니메이션 길이
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    // 핵심: 위치 변경은 spring 으로
    type: LayoutAnimation.Types.spring,
    springDamping: 0.8,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
} as const;

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
  // 순위가 아직 없으면 -위로 표시
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
};

function RandomBox({ onPress }: RandomBoxProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 20000, // 20초 동안 천천히 차오름
        easing: Easing.linear,
        useNativeDriver: false, // width라서 false
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <TouchableOpacity style={styles.randomBox} onPress={onPress}>
      <Image
        source={require('../../assets/images/RandomBox.png')}
        style={styles.randomBoxImage}
      />
      <View style={styles.randomGauge}>
        <Animated.View style={[styles.randomGaugeFill, { width: fillWidth }]} />
      </View>
    </TouchableOpacity>
  );
}

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

  const statusType = change;

  const statusText =
    change === 'up'
      ? `${prevRank - rank}위상승`
      : change === 'down'
        ? `${rank - prevRank}위하락`
        : '-';

  const statusIconSource =
    statusType === 'up'
      ? require('../../assets/images/up.png')
      : statusType === 'down'
        ? require('../../assets/images/down.png')
        : null;

  return (
    <TouchableOpacity
      style={styles.topCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.topCardFrame} />

      {/* 메달 본체 펄스 */}
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
  sharedAnim?: Animated.Value; // 추가: 외부 애니메이션 쓰면 타이밍 동기화
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
    if (sharedAnim) return; // sharedAnim 쓰면 여기서 loop 안 돌림

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

/* ========== 아래 랭킹 리스트 ========== */

type RankingRaw = {
  id: string;
  familyName: string;
  score: number; // 백엔드에서 이런 숫자만 내려온다고 가정
};

type RankingRow = RankingRaw & {
  rank: number;
  prevRank: number;
};

const rankingRaw: RankingRaw[] = [
  { id: 'minji', familyName: '민지네', score: 47195 },
  { id: 'fairy', familyName: '청소요정들', score: 31784 },
  { id: 'homeq', familyName: '잠안자고홈퀘', score: 20331 },
  { id: 'first', familyName: '오늘도1등각', score: 17228 },
  { id: 'run', familyName: '달리는중', score: 16742 },
  { id: 'gogo', familyName: '가보자고', score: 15369 },
  { id: 'momdad', familyName: '엄마아빠최고', score: 14205 },
];

// score 기준으로 정렬 + rank/prevRank 계산
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

// prevRank vs rank로 변화 계산
function getChange(row: RankingRow): 'none' | 'up' | 'down' {
  if (row.prevRank > row.rank) return 'up';
  if (row.prevRank < row.rank) return 'down';
  return 'none';
}

type RankingAllProps = {
  rows: RankingRow[];
  onRowPress: (row: RankingRow) => void;
  sharedAnim?: Animated.Value;
  flashAnim: Animated.Value;
};

function RankingAll({
  rows,
  onRowPress,
  sharedAnim,
  flashAnim,
}: RankingAllProps) {
  return (
    <View style={styles.rankingAll}>
      {rows.map((row) => {
        const change = getChange(row);
        const isUpRow = change === 'up';
        const isDownRow = change === 'down';

        let bgStyle = styles.rankRow;
        if (isUpRow) bgStyle = styles.rankRowUp;
        if (isDownRow) bgStyle = styles.rankRowDown;

        const changeIcon = isUpRow
          ? require('../../assets/images/up.png')
          : isDownRow
            ? require('../../assets/images/down.png')
            : null;

        return (
          <View
            key={row.id}
            style={[styles.rankRowBase, { position: 'relative' }]}
          >
            {(isUpRow || isDownRow) && (
              <View style={[StyleSheet.absoluteFill, bgStyle]} />
            )}

            {(isUpRow || isDownRow) && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  bgStyle,
                  { opacity: flashAnim },
                ]}
              />
            )}

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              activeOpacity={0.8}
              onPress={() => onRowPress(row)}
            >
              <View style={styles.rankRowLeft}>
                <Text style={styles.rankNumberText}>{row.rank}</Text>

                {changeIcon ? (
                  <BlinkImage
                    source={changeIcon}
                    style={styles.rankChangeIcon}
                    sharedAnim={sharedAnim}
                  />
                ) : (
                  <Text style={styles.rankChangeText}>-</Text>
                )}
              </View>

              <View style={styles.rankRowCenter}>
                <Text style={styles.rankFamilyName}>{row.familyName}</Text>
              </View>

              <View style={styles.rankRowRight}>
                <Text style={styles.rankScoreText}>
                  +{row.score.toLocaleString()}p
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
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
          // 이미 Ranking 탭이라 이동은 필요 없음
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

  const [rows, setRows] = useState<RankingRow[]>(computeRanks(rankingRaw));

  const sharedBlink = useRef(new Animated.Value(0)).current;

  const flashAnim = useRef(new Animated.Value(0)).current;

  const myFamilyId = 'homeq';
  const myRow = rows.find((r) => r.id === myFamilyId);

  const triggerBackgroundFlash = useCallback(() => {
    flashAnim.setValue(0);

    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [flashAnim]);

  const applyBackendScores = (newRaw: RankingRaw[]) => {
    setRows((prev) => {
      const prevRankMap: Record<string, number> = {};
      prev.forEach((p) => {
        prevRankMap[p.id] = p.rank;
      });

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      return computeRanks(newRaw, prevRankMap);
    });
  };

  // 1) sharedBlink 루프 + screen_view (한 번만)
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

  useEffect(() => {
    triggerBackgroundFlash();
  }, [triggerBackgroundFlash]);

  // 2) 안드로이드 LayoutAnimation enable
  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  // 3) 진입 직후 자리 재정렬 + 애니메이션
  useEffect(() => {
    const t = setTimeout(() => {
      LayoutAnimation.configureNext(rankingSwapLayout);
      setRows((prev) => [...prev].sort((a, b) => a.rank - b.rank));
    }, 80);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      // 테스트용: homeq 점수 +20000
      const newRaw = rankingRaw.map((r) => {
        if (r.id === 'homeq') return { ...r, score: r.score + 20000 };
        return r;
      });

      applyBackendScores(newRaw);
    }, 5000);

    return () => clearInterval(id);
  }, []);

  // 4) 가족 totalPoints 일괄 조회 (디버그용)
  useEffect(() => {
    async function load() {
      const list = await rankingService.getAllFamilyTotalPoints();
      logRankingEvent('all_family_points', list);
    }

    load();
  }, []);

  // 5) 업데이트 반영 확인 (디버그용)
  useEffect(() => {
    console.log('[Ranking] direct onSnapshot test start');

    const familiesRef = collection(db, 'families');
    const q = query(familiesRef, orderBy('totalFamilyPoints', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          '[Ranking] direct snapshot:',
          snapshot.docs.map((d, i) => ({
            id: d.id,
            rank: i + 1,
            ...d.data(),
          })),
        );
      },
      (error) => {
        console.log('[Ranking] direct onSnapshot error', error);
      },
    );

    return () => {
      console.log('[Ranking] direct onSnapshot unsubscribe');
      unsub();
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
            <RandomBox onPress={() => setShowReward(true)} />
          </View>
          <View style={styles.top3Row}>
            {(() => {
              // rows는 이미 score 기준으로 정렬+rank 계산된 상태
              const first = rows.find((r) => r.rank === 1);
              const second = rows.find((r) => r.rank === 2);
              const third = rows.find((r) => r.rank === 3);

              return (
                <>
                  {/* 2등(은) 왼쪽 */}
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

                  {/* 1등(금) 가운데 */}
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

                  {/* 3등(동) 오른쪽 */}
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

          <RankingAll
            rows={rows}
            sharedAnim={sharedBlink}
            flashAnim={flashAnim}
            onRowPress={(row) => logRankingEvent('rank_row_press', row)}
          />
        </View>
      </ScrollView>

      {/* ? 눌렀을 때 뜨는 말풍선 */}
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
    fontWeight: '400',
    color: '#000000',
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

  /* 랭킹 전체 리스트 */
  rankingAll: {
    marginTop: 16,
  },
  rankRowBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 23,
    marginBottom: 5,
  },
  rankRow: {
    backgroundColor: '#FFFFFF',
  },
  rankRowUp: {
    backgroundColor: 'rgba(255, 120, 120, 0.25)',
    borderRadius: 8,
  },
  rankRowDown: {
    backgroundColor: 'rgba(120, 140, 255, 0.25)',
    borderRadius: 8,
  },
  rankRowLeft: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankRowCenter: {
    flex: 1,
  },
  rankRowRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  rankNumberText: {
    fontSize: 15,
    color: '#000000',
    fontFamily: 'Roboto',
    marginRight: 8,
    fontWeight: '400',
  },
  rankChangeText: {
    fontSize: 15,
    color: '#000000',
    fontFamily: 'Roboto',
  },
  rankChangeIcon: {
    width: 11,
    height: 11,
    resizeMode: 'contain',
  },
  rankFamilyName: {
    fontSize: 13,
    color: '#000000',
    fontFamily: 'Roboto',
    textAlign: 'center',
    fontWeight: '500',
  },
  rankScoreText: {
    fontSize: 12,
    color: '#FF4D4F',
    fontFamily: 'Roboto',
    fontWeight: '500',
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
