// src/components/ChallengeDetails.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useChallengeStore, type Filter } from '@/src/store/useChallengeStore';

// durationType → "데일리/위클리/먼슬리"
const mapDurationTypeToLabel = (durationType?: string): string => {
  switch (durationType) {
    case 'daily':
      return '데일리';
    case 'weekly':
      return '위클리';
    case 'monthly':
      return '먼슬리';
    default:
      return '데일리';
  }
};

// 기간 pill 안 텍스트 ("1일/1주/1달")
const mapDurationTypeToPeriodLabel = (durationType?: string): string => {
  switch (durationType) {
    case 'daily':
      return '1일';
    case 'weekly':
      return '1주';
    case 'monthly':
      return '1달';
    default:
      return '1일';
  }
};

const getEndDateText = (durationType?: string): string => {
  const today = new Date();

  let end = new Date(today);

  switch (durationType) {
    case 'daily':
      end.setDate(end.getDate() + 1);
      break;
    case 'weekly':
      end.setDate(end.getDate() + 7);
      break;
    case 'monthly':
      end.setMonth(end.getMonth() + 1);
      break;
    default:
      end.setDate(end.getDate() + 1);
  }

  const month = end.getMonth() + 1;
  const date = end.getDate();

  return `${month}/${date}일까지!`;
};

// 오늘 날짜 "M/D일 완료!" 텍스트
const getTodayCompleteText = (): string => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  return `${month}/${date}일 완료!`;
};

const track = (event: string, params: Record<string, any>) => {
  console.log('[analytics]', event, params);
};

type Audience = '나' | '가족';

type ChallengeDetailProps = {
  onClose: () => void;
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

// 자동으로 달릴 가족 댓글 템플릿
const COMMENT_DATA: CommentItem[] = [
  {
    id: 'dad-1',
    author: '아빠',
    text: '그래. 딸 화이팅!',
    likeCount: 0,
    likedDefault: false,
  },
  {
    id: 'bro-1',
    author: '동생',
    text: '가족 등수 빨리 올리자',
    likeCount: 0,
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
    default:
      return require('../../assets/images/user1.png');
  }
};

// 챌린지 카테고리/deviceType -> 이미지 맵핑
const getImageByMeta = (opts: {
  domainCategory?: string; // '절약' | '가사' | '헬스' | ...
  deviceType?: string; // 'robot_cleaner' | 'dishwasher' | ...
}) => {
  const { domainCategory, deviceType } = opts;

  // 1) 헬스 계열 → 물 마시기
  if (domainCategory === '헬스') {
    return require('../../assets/images/water.png');
  }

  // 2) 절약 계열 → save 아이콘
  if (domainCategory === '절약') {
    return require('../../assets/images/save.png');
  }

  // 3) 가사 계열 → deviceType으로 분기
  if (domainCategory === '가사') {
    if (deviceType === 'robot_cleaner') {
      return require('../../assets/images/Robot.png');
    }
    if (deviceType === 'dishwasher') {
      return require('../../assets/images/dishwasher.png');
    }
    // 기타 가사 → 기본은 식세기
    return require('../../assets/images/dishwasher.png');
  }

  // 4) 그 외/전체 → 기본값
  return require('../../assets/images/dishwasher.png');
};

function ChallengeDetail({
  onClose,
  challengeId,
  from,
  audience,
  category,
}: ChallengeDetailProps) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [hasTriggeredFamilyReply, setHasTriggeredFamilyReply] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 키보드 높이
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const { ongoing, recommended, completeChallenge } = useChallengeStore();

  // 언마운트/닫힐 때 타이머 정리
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  // 키보드 이벤트 구독
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardOffset(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 현재 보고 있는 챌린지
  const challengeList = from === 'ongoing' ? ongoing : recommended;
  const challenge = challengeList.find((c) => c.id === challengeId);

  // ── 게이지/말풍선 계산용 값 ──
  const targetValue = challenge?.targetValue ?? 0;
  const currentValue = challenge?.currentValue ?? 0;

  const pctFromField =
    typeof challenge?.progressPct === 'number'
      ? challenge.progressPct / 100
      : 0;
  const ratioFromValues = targetValue > 0 ? currentValue / targetValue : 0;

  let progressRatio = pctFromField || ratioFromValues;
  progressRatio = Math.max(0, Math.min(progressRatio, 1)); // 0~1

  // 말풍선 계산
  const totalStepsRaw = targetValue > 0 ? targetValue : 2;
  const totalSteps = Math.max(1, Math.min(4, Math.round(totalStepsRaw)));

  const completedSteps = Math.max(
    0,
    Math.min(totalSteps, Math.round(currentValue)),
  );

  // 트래킹 useEffect (completedSteps 포함)
  useEffect(() => {
    if (!challenge) {
      track('challenge_detail_view_not_found', {
        challengeId,
        from,
      });
      return;
    }

    track('challenge_detail_view', {
      challengeId,
      from,
      audience,
      category,
    });

    track('challenge_detail_step_impression', {
      challengeId,
      totalSteps,
      completedSteps,
    });
  }, [
    challenge,
    challengeId,
    from,
    audience,
    category,
    totalSteps,
    completedSteps,
  ]);

  // challenge 못 찾은 경우 UI
  if (!challenge) {
    return (
      <View style={styles.detailContainer}>
        <TouchableOpacity style={styles.detailArrowButton} onPress={onClose}>
          <Image
            source={require('@/assets/images/Expand_right.png')}
            style={styles.detailArrowIcon}
          />
        </TouchableOpacity>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>
            챌린지 정보를 불러오지 못했어요.
          </Text>
        </View>
      </View>
    );
  }

  const domainLabel =
    challenge.domainCategory && challenge.domainCategory !== '전체'
      ? challenge.domainCategory
      : '전체';

  const durationLabel = mapDurationTypeToLabel(challenge.durationType);
  const periodLabel = mapDurationTypeToPeriodLabel(challenge.durationType);
  const endDateText = getEndDateText(challenge.durationType);
  const pointLabel = `${challenge.rewardPoints ?? 0}p`;
  const titleText = challenge.title ?? '챌린지 제목';
  const levelLabel =
    challenge.level === 1
      ? '쉬움'
      : challenge.level === 2
        ? '보통'
        : challenge.level === 3
          ? '어려움'
          : '보통';

  const handleClose = () => {
    track('challenge_detail_close', {
      challengeId,
      closeReason: 'arrow_button',
    });
    onClose();
  };

  const handleDemoComplete = async () => {
    try {
      track('challenge_demo_complete_click', {
        challengeId,
        from,
        audience,
        category,
      });

      // ✅ completeChallenge 결과로 완료 여부 / 포인트 / 남은 값 받기
      const result = await completeChallenge(challengeId);

      if (!result) return;

      const { isCompleted, rewardPoints, remainingValue, unit } = result;

      if (isCompleted && rewardPoints > 0) {
        // ✅ 완주 + 포인트 획득 팝업
        Alert.alert('챌린지 완료!', `${rewardPoints}p를 획득했어요!`);
      } else {
        // ✅ 아직 완주 전: 남은 양 안내
        const unitLabel = unit || challenge.unit || ''; // challenge는 위에서 찾은 객체
        const remainText =
          remainingValue > 0
            ? `완료까지 ${remainingValue}${unitLabel ? ` ${unitLabel}` : ''} 남았어요!`
            : '조금만 더면 완료예요!';

        Alert.alert('조금만 더!', remainText);
      }

      // 팝업 확인 후 바텀시트 닫기
      onClose();
    } catch (e) {
      console.log('[ChallengeDetail] demo complete error', e);
      Alert.alert(
        '완료 처리 오류',
        '챌린지를 완료 처리하는 중 문제가 발생했어요. 다시 시도해주세요.',
      );
    }
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

    // 1) 내 댓글 추가
    const myComment: CommentItem = {
      id: `me-${Date.now()}`,
      author: '나',
      text: trimmed,
      likeCount: 0,
      likedDefault: false,
    };

    setComments((prev) => [...prev, myComment]);
    setCommentText('');

    // 2) 가족 자동 댓글: 한 번만 실행
    if (!hasTriggeredFamilyReply) {
      setHasTriggeredFamilyReply(true);

      // 아빠 댓글 (1.5초 뒤)
      const t1 = setTimeout(() => {
        const dad = COMMENT_DATA[0];
        setComments((prev) => [...prev, dad]);
        setLikedMap((prev) => ({
          ...prev,
          [dad.id]: dad.likedDefault,
        }));
      }, 1500);

      // 동생 댓글 (3초 뒤)
      const t2 = setTimeout(() => {
        const bro = COMMENT_DATA[1];
        setComments((prev) => [...prev, bro]);
        setLikedMap((prev) => ({
          ...prev,
          [bro.id]: bro.likedDefault,
        }));
      }, 3000);

      timeoutsRef.current.push(t1, t2);
    }
  };

  return (
    <View style={styles.detailContainer}>
      {/* 위로 접기(닫기) 버튼 – 가운데 */}
      <TouchableOpacity style={styles.detailArrowButton} onPress={handleClose}>
        <Image
          source={require('@/assets/images/Expand_right.png')}
          style={styles.detailArrowIcon}
        />
      </TouchableOpacity>

      {/* 오른쪽 상단 완료 버튼 */}
      <TouchableOpacity
        style={styles.topCompleteButton}
        onPress={handleDemoComplete}
        activeOpacity={0.8}
      >
        <Text style={styles.topCompleteButtonText}>완료</Text>
      </TouchableOpacity>

      {/* 카테고리 / 제목 */}
      <View style={styles.detailHeader}>
        <Text style={styles.detailCategoryLabel}>
          {domainLabel} | {durationLabel}
        </Text>
        <Text style={styles.detailTitle}>{titleText}</Text>
      </View>

      {/* 게이지 + 로봇 + 말풍선 */}
      <View style={styles.detailProgressWrapper}>
        <View style={styles.detailProgressTrack}>
          {/* 게이지 바 */}
          <View style={styles.detailProgressLineBg}>
            <View
              style={[
                styles.detailProgressLineFill,
                { width: `${progressRatio * 100}%` },
              ]}
            />
          </View>

          <Image
            source={getImageByMeta({
              domainCategory: challenge.domainCategory,
              deviceType: (challenge as any).deviceType,
            })}
            style={[
              styles.detailRobotIcon,
              // 식세기일 때만 특수 스타일 주고 싶으면 유지
              (challenge as any).deviceType === 'dishwasher' &&
                styles.specialDishwasherIcon,
              {
                position: 'absolute',
                left: `${progressRatio * 100}%`,
                transform: [{ translateX: -30 }],
              },
            ]}
          />

          {/* 말풍선 레이어: 현재 위치 + 게이지 끝 2개만 표시 */}
          <View style={styles.progressBubbleLayer}>
            {/* 1) 현재 게이지 바로 아래 말풍선 (오늘 날짜) */}
            <View
              style={[
                styles.progressBubble,
                {
                  left: `${progressRatio * 100}%`,
                  transform: [{ translateX: '-50%' }],
                },
              ]}
            >
              <View style={styles.progressBubbleTail} />
              <Text style={styles.progressBubbleText}>
                {progressRatio > 0 ? getTodayCompleteText() : '-'}
              </Text>
            </View>

            {/* 2) 끝 말풍선 — 마감일 */}
            <View
              style={[
                styles.progressBubble,
                {
                  left: '100%',
                  transform: [{ translateX: '-50%' }],
                },
              ]}
            >
              <View style={styles.progressBubbleTail} />
              <Text style={styles.progressBubbleText}>{endDateText}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 기간 / 난이도 / 포인트 */}
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
          <Text style={styles.detailMetaPillText}>기간: {periodLabel}</Text>
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
          <Text style={styles.detailMetaPillText}>난이도: {levelLabel}</Text>
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
          <Text style={styles.detailMetaPillText}>포인트: {pointLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* 구분선 */}
      <View style={styles.detailDivider} />

      {/* 댓글 영역 */}
      <View style={styles.commentSection}>
        <Text style={styles.commentCountLabel}>댓글 {comments.length}개</Text>

        {comments.map((comment) => {
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
      <View
        style={[
          styles.commentInputBar,
          keyboardOffset ? { marginBottom: keyboardOffset } : null,
        ]}
      >
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

const styles = StyleSheet.create({
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
  topCompleteButton: {
    position: 'absolute',
    top: 12,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
  },
  topCompleteButtonText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  detailHeader: {
    marginBottom: -15,
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
    fontSize: 16,
    fontWeight: '500',
  },

  /* 게이지 + 말풍선 */
  detailProgressWrapper: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 35,
  },
  detailProgressTrack: {
    width: 243,
    height: 80,
    justifyContent: 'center',
    position: 'relative',
  },
  detailProgressLineBg: {
    width: '100%',
    height: 10,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  detailProgressLineFill: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#5E75FD',
  },
  detailRobotIcon: {
    width: 75,
    height: 69,
    resizeMode: 'contain',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    marginBottom: 13,
    marginLeft: -13,
  },
  specialDishwasherIcon: {
    marginLeft: 8,
    width: 50,
    height: 50,
  },
  progressBubbleLayer: {
    position: 'absolute',
    top: 75, // 게이지 아래로 살짝 내려오게
    left: 0,
    width: '100%',
    height: 50,
  },
  progressBubble: {
    position: 'absolute',
    backgroundColor: '#353535',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
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
    marginLeft: 3,
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
    minWidth: 90,
    height: 19,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#353535',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
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
    marginLeft: 40,
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

  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 12,
    marginHorizontal: -24,
    marginBottom: 20,
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

export default ChallengeDetail;
