// src/screens/Challenge.tsx
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function Header() {
  return (
    <View style={styles.header}>
      {/* HeaderLogo */}
      <Text style={styles.headerLogo}>HomeQuest</Text>

      {/* SettingButton */}
      <TouchableOpacity style={styles.settingButton}>
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

function CategoryButton({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        active ? styles.categoryButtonActive : styles.categoryButtonInactive,
      ]}
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

function CategoryFilterGroup() {
  return (
    <View style={styles.categoryFilterGroup}>
      {/* Row1: 나 / 가족 */}
      <View style={styles.categoryRow}>
        <CategoryButton label="나" active />
        <View style={{ width: 12 }} />
        <CategoryButton label="가족" />
      </View>

      {/* Row2: 전체 / 절약 / 가사 / 헬스 */}
      <View style={styles.categoryRow2}>
        <CategoryButton label="전체" active />
        <View style={{ width: 12 }} />
        <CategoryButton label="절약" />
        <View style={{ width: 12 }} />
        <CategoryButton label="가사" />
        <View style={{ width: 12 }} />
        <CategoryButton label="헬스" />
      </View>
    </View>
  );
}

function MyChallengeSection() {
  return (
    <View style={styles.myChallengeSection}>
      <Text style={styles.sectionTitle}>나의 챌린지 현황</Text>

      <View style={styles.missionStatsCard}>
        {/* 참여한 미션 */}
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>50</Text>
          <Text style={styles.statLabel}>참여한 미션</Text>
        </View>

        {/* 세로 구분선 */}
        <View style={styles.verticalDivider} />

        {/* 성공한 미션 */}
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>34</Text>
          <Text style={styles.statLabel}>성공한 미션</Text>
        </View>

        {/* 세로 구분선 */}
        <View style={styles.verticalDivider} />

        {/* 미션 성공률 */}
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>68%</Text>
          <Text style={styles.statLabel}>미션 성공률</Text>
        </View>
      </View>
    </View>
  );
}

/** 기본 카드 버전 (2번째, 3번째 카드용) */
function ChallengeCard({
  category,
  type,
  title,
  badgeText,
  progressRatio,
}: {
  category: string;
  type: string;
  title: string;
  badgeText: string;
  progressRatio: number; // 0~1
}) {
  return (
    <View style={styles.challengeCard}>
      {/* 상단 카테고리 행 */}
      <View style={styles.challengeCardHeader}>
        <Text style={styles.challengeMetaText}>{category}</Text>
        <View style={styles.metaDivider} />
        <Text style={styles.challengeMetaText}>{type}</Text>
        <View style={{ flex: 1 }} />
        <Image
          source={require('../../assets/images/tabler_chevron-left.png')}
          style={styles.chevronIcon}
        />
      </View>

      {/* 타이틀 */}
      <Text style={styles.challengeTitle}>{title}</Text>

      {/* 배지 */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badgeText}</Text>
      </View>

      {/* 배지 아래 삼각형 */}
      <Image
        source={require('../../assets/images/Polygon2.png')}
        style={styles.badgeTriangle}
      />

      {/* 게이지 */}
      <View style={styles.progressBarBg}>
        <View
          style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]}
        />
      </View>
    </View>
  );
}

/** 첫 번째 카드(0잔, 바 숨김 + 타이틀 중앙)용 */
function ChallengeCardv2({
  category,
  type,
  title,
  badgeText,
  progressRatio,
}: {
  category: string;
  type: string;
  title: string;
  badgeText: string;
  progressRatio: number; // 0 ~ 1
}) {
  const hasProgress = progressRatio > 0;

  return (
    <View style={styles.challengeCard2}>
      {/* 상단 카테고리 행 */}
      <View style={styles.challengeCardHeader}>
        <Text style={styles.challengeMetaText}>{category}</Text>
        <View style={styles.metaDivider} />
        <Text style={styles.challengeMetaText}>{type}</Text>
        <View style={{ flex: 1 }} />
        <Image
          source={require('../../assets/images/tabler_chevron-left.png')}
          style={styles.chevronIcon}
        />
      </View>

      {/* 타이틀 - 중앙 정렬 */}
      <Text style={styles.challengeTitle}>{title}</Text>

      {/* 배지 */}
      <View style={styles.badge2}>
        <Text style={styles.badgeText2}>{badgeText}</Text>
      </View>
      {/* 배지 아래 삼각형 */}
      <Image
        source={require('../../assets/images/Polygon2.png')}
        style={styles.badgeTriangle2}
      />

      {/* 게이지 */}
      <View style={styles.progressBarBg}>
        {hasProgress && (
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressRatio * 100}%` },
            ]}
          />
        )}
      </View>
    </View>
  );
}

function ChallengeProgressSection() {
  return (
    <View style={styles.challengeProgressSection}>
      <Text style={styles.sectionTitle}>진행중인 챌린지</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.challengeCardList}
      >
        <ChallengeCardv2
          category="헬스"
          type="데일리"
          title="물 한잔 마시기"
          badgeText="0잔"
          progressRatio={0}
        />
        <ChallengeCard
          category="가사"
          type="릴레이"
          title="돌아가며 청소기 돌리기"
          badgeText="3명 성공"
          progressRatio={0.7}
        />
        <ChallengeCard
          category="가사"
          type="릴레이"
          title="돌아가며 설거지하기"
          badgeText="3명 성공"
          progressRatio={0.7}
        />
      </ScrollView>
    </View>
  );
}

function RecommendedChallengeSection() {
  return (
    <View style={styles.recommendedChallengeSection}>
      {/* SectionHeader */}
      <View style={styles.recommendedHeader}>
        <Text style={styles.sectionTitle}>추천 챌린지</Text>
        <TouchableOpacity>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* 카드 */}
      <View style={styles.recommendedCard}>
        {/* 삭제 버튼 (오른쪽 상단 X 아이콘) */}
        <TouchableOpacity style={styles.deleteButton}>
          <Image
            source={require('../../assets/images/Vector.png')}
            style={styles.deleteIcon}
          />
        </TouchableOpacity>

        {/* 상단 메타 */}
        <View style={styles.recommendedMetaRow}>
          <Text style={styles.challengeMetaText}>가사</Text>
          <View style={styles.metaDivider} />
          <Text style={styles.challengeMetaText}>스피드</Text>
          <Image
            source={require('../../assets/images/tdesign_time-filled.png')}
            style={styles.metaIcon}
          />
          <Text style={styles.challengeMetaText}>10:00:00</Text>
        </View>

        {/* 본문 */}
        <View style={styles.recommendedContentRow}>
          {/* 식세기 이미지 자리 */}
          <Image
            source={require('../../assets/images/dishwasher.png')}
            style={styles.dishwasherIcon}
          />

          <View style={styles.recommendedTextCol}>
            <Text style={styles.recommendedTitle}>식기세척기 돌리기</Text>
            <Text style={styles.recommendedPoint}>40p 받기</Text>
          </View>

          {/* 도전 버튼 */}
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>도전</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PageIndicatorDots() {
  return (
    <View style={styles.pageIndicatorDots}>
      <View style={styles.dotInactive} />
      <View style={styles.dotActive} />
      <View style={styles.dotInactive} />
    </View>
  );
}

function BottomTabBar() {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.7}
        onPress={() => {
          // TODO: Home 탭으로 이동
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
          // TODO: Challenge 탭으로 이동
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
        onPress={() => {
          // TODO: Reward 탭으로 이동
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
          // TODO: Ranking 탭으로 이동
        }}
      >
        <Image
          source={require('../../assets/images/ranking.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

/* ============ 메인 스크린 ============ */

export function Challenge() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.main}>
          <CategoryFilterGroup />
          <MyChallengeSection />
          <ChallengeProgressSection />
          <RecommendedChallengeSection />
        </View>

        <PageIndicatorDots />
      </ScrollView>

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
    paddingTop: 16,
    paddingBottom: 16,
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

  /* 카테고리 필터 그룹 */
  categoryFilterGroup: {
    marginTop: 0,
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  categoryButton: {
    width: 63,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    minHeight: 33,
    justifyContent: 'center',
    alignItems: 'center',
    // 그림자 (iOS)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    // 안드로이드
    elevation: 3,
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
    marginBottom: 10,
    fontFamily: 'Roboto',
    fontWeight: '500',
  },

  /* 나의 챌린지 현황 */
  myChallengeSection: {
    marginBottom: 20,
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
    shadowRadius: 6,
    elevation: 3,
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
    marginBottom: 20,
  },
  challengeCardList: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  challengeCard: {
    width: 147,
    height: 108,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    // 그림자
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },

  challengeCard2: {
    width: 135,
    height: 108,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    // 그림자
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
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
    marginBottom: 4,
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
    marginLeft: 10,
    marginRight: 10,
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

  /* 추천 챌린지 */
  recommendedChallengeSection: {
    marginBottom: 1,
  },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  refreshIcon: {
    marginRight: 240,
    fontSize: 20,
    marginTop: -11,
    color: '#353535',
    fontWeight: '500',
  },
  recommendedCard: {
    width: 335,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    // 그림자
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    height: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#949494',
    marginHorizontal: 4,
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
});

export default Challenge;
