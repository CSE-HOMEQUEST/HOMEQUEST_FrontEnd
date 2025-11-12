// src/screens/Ranking.tsx
import { router } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

function Header() {
  return (
    <View style={styles.header}>
      {/* HeaderLogo */}
      <Text style={styles.headerLogo}>HomeQuest</Text>

      {/* SettingButton */}
      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => router.push('/Setting')}
      >
        <Image
          source={require('../../assets/images/SettingButton.png')}
          style={styles.settingIcon}
        />
      </TouchableOpacity>

      {/* Line7 */}
      <View style={styles.line7} />
    </View>
  );
}

function MyRankingCard() {
  return (
    <View style={styles.myRankingCard}>
      {/* 왼쪽: "내 랭킹" */}
      <View style={styles.myRankingLeft}>
        <Text style={styles.myRankingLabel}>내 랭킹</Text>
      </View>

      {/* 가운데 세로 라인 */}
      <View style={styles.myRankingDivider} />

      {/* 오른쪽: 랭킹 텍스트 */}
      <View style={styles.myRankingRight}>
        {/* 1줄차: 닉네임 + 설명 */}
        <Text style={styles.myRankingLine1}>
          <Text style={styles.myRankingName}>잠안자고 홈퀘</Text>
          <Text style={styles.myRankingSub}> 님의 랭킹은</Text>
        </Text>

        {/* 2줄차: 6위 + 입니다 */}
        <Text style={styles.myRankingLine2}>
          <Text style={styles.myRankingNumber}>6위</Text>
          <Text style={styles.myRankingSub}> 입니다</Text>
        </Text>
      </View>
    </View>
  );
}

/** ? 버튼용 props */
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
    // ? 버튼의 화면 좌표 측정
    infoRef.current?.measureInWindow((x, y, width, height) => {
      onPressInfo({ x, y, width, height });
    });
  };

  return (
    <View style={styles.rankingInfo}>
      {/* 기간 / 참가자 정보 */}
      <View style={styles.rankingPeriodRow}>
        <Text style={styles.rankingPeriodText}>
          10.1~10.31 | 총 529명 참석중
        </Text>
      </View>

      {/* 지역 + 물음표 버튼 */}
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

function RandomBox() {
  return (
    <View style={styles.randomBox}>
      <Image
        source={require('../../assets/images/RandomBox.png')}
        style={styles.randomBoxImage}
      />

      <View style={styles.randomGauge}>
        <View style={styles.randomGaugeFill} />
      </View>
    </View>
  );
}

type TopPlaceProps = {
  place: 1 | 2 | 3;
  familyName: string;
  scoreText: string;
  statusText: string;
  statusType: 'none' | 'up' | 'down';
};

function TopPlaceCard({
  place,
  familyName,
  scoreText,
  statusText,
  statusType,
}: TopPlaceProps) {
  const medalSource =
    place === 1
      ? require('../../assets/images/MedalIcon1.png')
      : place === 2
        ? require('../../assets/images/MedalIcon2.png')
        : require('../../assets/images/MedalIcon3.png');

  const statusIconSource =
    statusType === 'up'
      ? require('../../assets/images/up.png')
      : statusType === 'down'
        ? require('../../assets/images/down.png')
        : null;

  return (
    <View style={styles.topCard}>
      {/* 위쪽 반투명 프레임 */}
      <View style={styles.topCardFrame} />

      {/* 메달 아이콘 */}
      <Image source={medalSource} style={styles.medalIcon} />

      {/* 가족 이름 / 점수 / 상태 */}
      <Text style={styles.topFamilyName}>{familyName}</Text>
      <Text style={styles.topScoreText}>{scoreText}</Text>

      <View style={styles.topStatusBadge}>
        <Text style={styles.topStatusText}>{statusText}</Text>
        {statusIconSource && (
          <Image source={statusIconSource} style={styles.topStatusIcon} />
        )}
      </View>
    </View>
  );
}

type RankingRow = {
  rank: number;
  change: 'none' | 'up' | 'down';
  familyName: string;
  score: string;
};

const rankingRows: RankingRow[] = [
  { rank: 4, change: 'none', familyName: '민지네', score: '+47,195p' },
  { rank: 5, change: 'none', familyName: '청소요정들', score: '+31,784p' },
  { rank: 6, change: 'up', familyName: '잠안자고홈퀘', score: '+20,331p' },
  { rank: 7, change: 'down', familyName: '오늘도1등각', score: '+17,228p' },
  { rank: 8, change: 'none', familyName: '달리는중', score: '+16,742p' },
  { rank: 9, change: 'none', familyName: '가보자고', score: '+15,369p' },
  { rank: 10, change: 'up', familyName: '엄마아빠최고', score: '+14,205p' },
];

function RankingAll() {
  return (
    <View style={styles.rankingAll}>
      {rankingRows.map((row) => {
        let rowStyle = styles.rankRow;
        if (row.rank === 6 || row.rank === 10) {
          rowStyle = styles.rankRowUp;
        } else if (row.rank === 7) {
          rowStyle = styles.rankRowDown;
        }

        const changeIcon =
          row.change === 'up'
            ? require('../../assets/images/up.png')
            : row.change === 'down'
              ? require('../../assets/images/down.png')
              : null;

        return (
          <View
            key={row.rank}
            style={[styles.rankRowBase, rowStyle]} // 기본 스타일 + 배경색
          >
            {/* 순위 + 변화 아이콘 */}
            <View style={styles.rankRowLeft}>
              <Text style={styles.rankNumberText}>{row.rank}</Text>
              {changeIcon ? (
                <Image source={changeIcon} style={styles.rankChangeIcon} />
              ) : (
                <Text style={styles.rankChangeText}>-</Text>
              )}
            </View>

            {/* 가족 이름 */}
            <View style={styles.rankRowCenter}>
              <Text style={styles.rankFamilyName}>{row.familyName}</Text>
            </View>

            {/* 점수 */}
            <View style={styles.rankRowRight}>
              <Text style={styles.rankScoreText}>{row.score}</Text>
            </View>
          </View>
        );
      })}
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
        onPress={() => router.push('/two')}
      >
        <Image
          source={require('../../assets/images/challenge_.png')}
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
        onPress={() => {
          // TODO: Ranking 탭으로 이동
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

export function Ranking() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <Header />

        {/* 나머지 컨텐츠는 main 안에 넣기 */}
        <View style={styles.main}>
          {/* 내 랭킹 카드 */}
          <MyRankingCard />

          {/* 기간 / 지역 / 랜덤박스 */}
          <View style={styles.infoRow}>
            <RankingInfo
              onPressInfo={(pos) => {
                setTooltipPos(pos);
                setShowTooltip(true);
              }}
            />
            <RandomBox />
          </View>

          {/* 상위 3등 카드 */}
          <View style={styles.top3Row}>
            {/* 2등 카드 */}
            <View style={styles.secondPlaceWrapper}>
              <TopPlaceCard
                place={2}
                familyName="가전왕패밀리"
                scoreText="+72,538p"
                statusText="1위상승"
                statusType="up"
              />
            </View>

            {/* 1등 카드 */}
            <View style={styles.firstPlaceWrapper}>
              <TopPlaceCard
                place={1}
                familyName="1등은우리꺼"
                scoreText="+83,912p"
                statusText="-"
                statusType="none"
              />
            </View>

            {/* 3등 카드 */}
            <View style={styles.thirdPlaceWrapper}>
              <TopPlaceCard
                place={3}
                familyName="홈퀘함?"
                scoreText="+61,284p"
                statusText="1위하락"
                statusType="down"
              />
            </View>
          </View>

          {/* 랭킹 리스트 */}
          <RankingAll />
        </View>
      </ScrollView>

      {/* ? 눌렀을 때 뜨는 말풍선 */}
      {showTooltip && tooltipPos && (
        <View style={styles.tooltipBackdrop}>
          {/* 화살표 */}
          <View
            style={[
              styles.tooltipArrow,
              {
                top: tooltipPos.y - 75,
                left: tooltipPos.x + tooltipPos.width / 2 - 13, // 12 = 화살표 가로 절반
              },
            ]}
          />

          {/* 말풍선 박스 */}
          <View
            style={[
              styles.tooltipBox,
              {
                top: tooltipPos.y - 75 + 8, // ? 바로 아래 8px
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
              onPress={() => setShowTooltip(false)}
            >
              <Text style={styles.tooltipCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginTop: 50,
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
    width: 30,
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
    backgroundColor: 'rgba(226, 178, 178, 0.4)',
    borderRadius: 8,
  },
  rankRowDown: {
    backgroundColor: 'rgba(169, 172, 225, 0.4)',
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
});
