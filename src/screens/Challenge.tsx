import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

import { useChallengeStore } from '@/src/store/useChallengeStore';
import type { Filter } from '@/src/store/useChallengeStore';

type Audience = '나' | '가족';

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

function ChallengeCard({
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

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badgeText}</Text>
      </View>

      <Image
        source={require('../../assets/images/Polygon2.png')}
        style={styles.badgeTriangle}
      />

      <View style={styles.progressBarBg}>
        <View
          style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]}
        />
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

  return (
    <View style={styles.challengeCard2}>
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

      <View style={styles.badge2}>
        <Text style={styles.badgeText2}>{badgeText}</Text>
      </View>
      <Image
        source={require('../../assets/images/Polygon2.png')}
        style={styles.badgeTriangle2}
      />

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

function ChallengeProgressSection({
  onPressRelayDetail,
}: {
  onPressRelayDetail: () => void;
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
          onPressDetail={onPressRelayDetail}
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

type RecommendedChallenge = {
  id: string;
  category: string;
  mode: string;
  title: string;
  time: string;
  point: number;
};

const RECOMMENDED_DATA: RecommendedChallenge[] = [
  {
    id: 'dishwasher',
    category: '가사',
    mode: '스피드',
    title: '식기세척기 돌리기',
    time: '10:00:00',
    point: 40,
  },
  {
    id: 'laundry',
    category: '가사',
    mode: '데일리',
    title: '세탁기 돌리기',
    time: '00:30:00',
    point: 30,
  },
  {
    id: 'steps',
    category: '헬스',
    mode: '릴레이',
    title: '가족 만보 걷기',
    time: '24:00:00',
    point: 50,
  },
];

type RecommendedChallengeSectionProps = {
  onPressStart: (id: string) => void;
  onIndexChange: (index: number) => void;
};

function RecommendedChallengeSection({
  onPressStart,
  onIndexChange,
}: RecommendedChallengeSectionProps) {
  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const width = e.nativeEvent.layoutMeasurement.width || 1;
    const offset = e.nativeEvent.contentOffset.x;
    const rawIndex = offset / width;
    let index = Math.round(rawIndex);

    if (index < 0) index = 0;
    if (index > RECOMMENDED_DATA.length - 1) {
      index = RECOMMENDED_DATA.length - 1;
    }

    onIndexChange(index);
  };

  return (
    <View style={styles.recommendedChallengeSection}>
      <View style={styles.recommendedHeader}>
        <Text style={styles.recommendTitle}>추천 챌린지</Text>
        <TouchableOpacity
          onPress={() => {
            console.log('[Challenge] 추천 새로고침 클릭');
          }}
        >
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={RECOMMENDED_DATA}
        horizontal
        pagingEnabled
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 24 }}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <View style={styles.recommendedCard}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                console.log('[Challenge] 추천 카드 닫기', item.id);
              }}
            >
              <Image
                source={require('../../assets/images/Vector.png')}
                style={styles.deleteIcon}
              />
            </TouchableOpacity>

            <View style={styles.recommendedMetaRow}>
              <Text style={styles.challengeMetaText}>{item.category}</Text>
              <View style={styles.metaDivider} />
              <Text style={styles.challengeMetaText}>{item.mode}</Text>
              <Image
                source={require('../../assets/images/tdesign_time-filled.png')}
                style={styles.metaIcon}
              />
              <Text style={styles.challengeMetaText}>{item.time}</Text>
            </View>

            <View style={styles.recommendedContentRow}>
              <Image
                source={require('../../assets/images/dishwasher.png')}
                style={styles.dishwasherIcon}
              />

              <View style={styles.recommendedTextCol}>
                <Text style={styles.recommendedTitle}>{item.title}</Text>
                <Text style={styles.recommendedPoint}>{item.point}p 받기</Text>
              </View>

              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => onPressStart(item.id)}
              >
                <Text style={styles.ctaButtonText}>도전</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function PageIndicatorDots({ activeIndex = 0 }: { activeIndex?: number }) {
  const dots = [0, 1, 2];

  return (
    <View style={styles.pageIndicatorDots}>
      {dots.map((idx) => (
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

// 파일 상단 어딘가(컴포넌트들 위)에 추가해도 되고,
// ChallengeDetail 바로 위에 둬도 돼
const track = (event: string, params: Record<string, any>) => {
  console.log('[analytics]', event, params);
};

// 상세 하단 시트
type ChallengeDetailProps = {
  onClose: () => void;

  // ✅ 로그에 쓰기 위한 메타데이터
  challengeId: string;
  from: 'ongoing' | 'recommended';
  audience: Audience; // '나' | '가족'
  category: Filter; // '전체' | '절약' | '가사' | '헬스'
};

type CommentItem = {
  id: string;
  author: string;
  text: string;
  likeCount: number;
  likedDefault: boolean;
};

const COMMENT_DATA: CommentItem[] = [
  {
    id: 'c1',
    author: '누나',
    text: '이따가 제가 돌릴게요!',
    likeCount: 3,
    likedDefault: false,
  },
  {
    id: 'c2',
    author: '아빠',
    text: '그래. 화이팅!',
    likeCount: 1,
    likedDefault: true,
  },
  {
    id: 'c3',
    author: '동생',
    text: '누나만 하면 50포인트다~',
    likeCount: 2,
    likedDefault: false,
  },
];

const getAvatarByAuthor = (author: string) => {
  switch (author) {
    case '누나':
      return require('../../assets/images/user1.png');
    case '아빠':
      return require('../../assets/images/user2.png');
    case '동생':
      return require('../../assets/images/user3.png');
  }
};

function ChallengeDetail({
  onClose,
  challengeId,
  from,
  audience,
  category,
}: ChallengeDetailProps) {
  const [commentText, setCommentText] = useState('');
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    COMMENT_DATA.forEach((c) => {
      init[c.id] = c.likedDefault;
    });
    return init;
  });

  // 화면 진입 로그
  useEffect(() => {
    track('challenge_detail_view', {
      challengeId,
      from,
      audience,
      category,
    });

    // 진행 스텝 노출 로그 (예시 값)
    track('challenge_detail_step_impression', {
      challengeId,
      totalSteps: 4,
      completedSteps: 3,
      currentStepOwner: '아빠',
    });
  }, [challengeId, from, audience, category]);

  const handleClose = () => {
    track('challenge_detail_close', {
      challengeId,
      closeReason: 'arrow_button',
    });
    onClose();
  };

  const handleLikeToggle = (comment: CommentItem) => {
    const before = likedMap[comment.id] ?? comment.likedDefault;
    const after = !before;

    setLikedMap((prev) => ({ ...prev, [comment.id]: after }));

    track('challenge_comment_like_toggle', {
      challengeId,
      commentId: comment.id,
      likedAfter: after,
      likeCountBefore: comment.likeCount,
    });
  };

  const handleCommentFocus = () => {
    track('challenge_comment_input_focus', {
      challengeId,
    });
  };

  const handleSubmitComment = () => {
    const trimmed = commentText.trim();

    if (!trimmed) {
      track('challenge_comment_submit_fail', {
        challengeId,
        reason: 'empty',
      });
      return;
    }

    track('challenge_comment_submit', {
      challengeId,
      contentLength: trimmed.length,
      hasEmoji: /[\u{1F300}-\u{1FAFF}]/u.test(trimmed),
      from: 'detail_bottom_input',
    });

    // 실제로는 서버 전송 로직이 들어갈 자리
    setCommentText('');
  };

  return (
    <View style={styles.detailContainer}>
      {/* 위로 접기 버튼 */}
      <TouchableOpacity style={styles.detailArrowButton} onPress={handleClose}>
        <Image
          source={require('../../assets/images/Expand_right.png')}
          style={styles.detailArrowIcon}
        />
      </TouchableOpacity>

      {/* 카테고리 / 제목 */}
      <View style={styles.detailHeader}>
        <Text style={styles.detailCategoryLabel}>가사 | 릴레이</Text>
        <Text style={styles.detailTitle}>
          엄마&gt;동생&gt;아빠&gt;누나 손으로 로봇청소기 돌리기
        </Text>
      </View>

      {/* 진행 dots + 로봇 + 라인 */}
      <View style={styles.detailProgressWrapper}>
        <View style={styles.detailProgressDotsRow}>
          <View style={styles.detailDotDone} />
          <View style={styles.detailDotDone} />
          <Image
            source={require('../../assets/images/Robot.png')}
            style={styles.detailRobotIcon}
          />
          <View style={styles.detailDotYet} />
        </View>

        <View style={styles.detailProgressLineBg}>
          <View style={styles.detailProgressLineFill} />
        </View>
      </View>

      {/* 진행 상태 말풍선들 */}
      <View style={styles.progressBubbleRow}>
        {/* 엄마 */}
        <View className="bubble">
          <View style={styles.progressBubble}>
            <View style={styles.progressBubbleTail} />
            <Text style={styles.progressBubbleText}>엄마{'\n'}10/1 완료!</Text>
          </View>
        </View>

        {/* 동생 */}
        <View style={styles.progressBubble}>
          <View style={styles.progressBubbleTail} />
          <Text style={styles.progressBubbleText}>동생{'\n'}10/3 완료!</Text>
        </View>

        {/* 아빠 */}
        <View style={styles.progressBubble}>
          <View style={styles.progressBubbleTail} />
          <Text style={styles.progressBubbleText}>아빠{'\n'}10/5 완료!</Text>
        </View>
      </View>

      {/* 기간 / 모드 / 포인트 */}
      <View style={styles.detailMetaPillRow}>
        <TouchableOpacity
          style={styles.detailMetaPill}
          onPress={() =>
            track('challenge_detail_meta_pill_click', {
              challengeId,
              pillType: 'duration',
            })
          }
        >
          <Text style={styles.detailMetaPillText}>기간: 1주</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.detailMetaPill}
          onPress={() =>
            track('challenge_detail_meta_pill_click', {
              challengeId,
              pillType: 'mode',
            })
          }
        >
          <Text style={styles.detailMetaPillText}>모드: easy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.detailMetaPill}
          onPress={() =>
            track('challenge_detail_meta_pill_click', {
              challengeId,
              pillType: 'point',
            })
          }
        >
          <Text style={styles.detailMetaPillText}>포인트: 50p</Text>
        </TouchableOpacity>
      </View>

      {/* 구분선 */}
      <View style={styles.detailDivider} />

      {/* 댓글 영역 */}
      <View style={styles.commentSection}>
        <Text style={styles.commentCountLabel}>
          댓글 {COMMENT_DATA.length}개
        </Text>

        {COMMENT_DATA.map((comment) => {
          const liked = likedMap[comment.id] ?? comment.likedDefault;
          const isDad = comment.author === '아빠';

          return (
            <React.Fragment key={comment.id}>
              <View style={[styles.commentRow, isDad && styles.commentRowDad]}>
                <View style={styles.commentAvatarWrapper}>
                  <Image
                    source={getAvatarByAuthor(comment.author)}
                    style={styles.commentAvatar}
                  />
                </View>
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentMeta}>
                    2025.10.08. 16:30 답글쓰기
                  </Text>
                </View>

                {/* 좋아요 영역을 TouchableOpacity로 감싸서 토글 */}
                <TouchableOpacity
                  style={styles.commentLikeBox}
                  onPress={() => handleLikeToggle(comment)}
                >
                  <Image
                    source={
                      liked
                        ? require('../../assets/images/heart-red.png')
                        : require('../../assets/images/heart-black.png')
                    }
                    style={styles.commentLikeIcon}
                  />
                  <Text style={styles.commentLikeCount}>
                    {comment.likeCount +
                      (liked ? 1 : 0) -
                      (comment.likedDefault ? 1 : 0)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.commentInnerDivider} />
            </React.Fragment>
          );
        })}
      </View>

      {/* 댓글 입력 바 */}
      <View style={styles.commentInputBar}>
        <TextInput
          style={styles.commentInput}
          placeholder="응원의 댓글을 입력해주세요 :)"
          placeholderTextColor="#A3A3A3"
          value={commentText}
          onChangeText={setCommentText}
          onFocus={handleCommentFocus}
        />
        <TouchableOpacity
          style={styles.commentSendButton}
          onPress={handleSubmitComment}
        >
          <Text style={styles.commentSendText}>전송</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ============ 메인 스크린 ============ */

export function Challenge() {
  console.log('[Challenge] render');

  const [showDetail, setShowDetail] = useState(false);
  const [audience, setAudience] = useState<Audience>('나');
  const [activeRecIndex, setActiveRecIndex] = useState(0);

  const { currentFilter, setFilter, hydrate, startChallenge } =
    useChallengeStore();

  useEffect(() => {
    console.log('[Challenge] useEffect → hydrate()');
    hydrate();
  }, [hydrate]);

  const onCategoryChange = (filter: Filter) => {
    console.log('[Challenge] onFilterPress', filter);
    setFilter(filter);
    hydrate();
  };

  const onAudienceChange = (value: Audience) => {
    console.log('[Challenge] onAudienceChange', value);
    setAudience(value);
  };

  const onPressStart = async (id: string) => {
    console.log('[Challenge] onPressStart → startChallenge', id);
    await startChallenge(id);
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
            onAudienceChange={onAudienceChange}
            onCategoryChange={onCategoryChange}
          />

          <MyChallengeSection />

          <ChallengeProgressSection
            onPressRelayDetail={() => setShowDetail(true)}
          />

          <RecommendedChallengeSection
            onPressStart={onPressStart}
            onIndexChange={setActiveRecIndex}
          />
        </View>

        <PageIndicatorDots activeIndex={activeRecIndex} />
      </ScrollView>

      <BottomTabBar />

      {showDetail && (
        <View style={styles.detailSheetWrapper}>
          <ChallengeDetail onClose={() => setShowDetail(false)} />
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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

  progressBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start', // ✅ 왼쪽 정렬
    columnGap: 10, // ✅ 버블 사이 간격 (기존보다 좁게 조정)
    paddingHorizontal: 0, // ✅ 기존 패딩 제거 (좌우 간격 넓힐 때만 필요)
    marginTop: 10,
    marginBottom: 7,
    marginLeft: 15, // ✅ 전체를 왼쪽으로 옮기고 싶을 때 조정 (값 작일수록 왼쪽으로)
  },

  progressBubble: {
    backgroundColor: '#353535',
    borderRadius: 30,
    paddingHorizontal: 2,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    position: 'relative', // <- 삼각형 꼬리를 내부에 두기 위해 필요
  },

  progressBubbleText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
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
