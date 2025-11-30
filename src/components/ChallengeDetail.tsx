// src/components/ChallengeDetails.tsx
import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Filter } from '@/src/store/useChallengeStore';

const track = (event: string, params: Record<string, any>) => {
  console.log('[analytics]', event, params);
};

type Audience = '나' | '가족';

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
          source={require('@/assets/images/Expand_right.png')}
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

const styles = StyleSheet.create({
  /* ===== 상세 하단시트 ===== */
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

export default ChallengeDetail;
