// src/components/RankingList.tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type RankingRow = {
  id: string;
  familyName: string;
  score: number;
  rank: number;
  prevRank: number; // 순위 변화 표시용 (지금은 부모에서 사용)
};

type Props = {
  rows: RankingRow[];
  highlightedFamilies?: Record<string, 'up' | 'down'>; // ⬅ 추가
  onPressRow?: (row: RankingRow) => void;
};

const ROW_HEIGHT = 64; // 한 행 높이 대략값

export function RankingList({
  rows,
  highlightedFamilies = {},
  onPressRow,
}: Props) {
  // id별 translateY 값 저장
  const animMap = useRef<Record<string, Animated.Value>>({}).current;
  // 이전 렌더에서의 순서
  const prevOrderRef = useRef<string[]>([]);

  // 필요한 id들에 대해 Animated.Value 준비
  rows.forEach((row) => {
    if (!animMap[row.id]) {
      animMap[row.id] = new Animated.Value(0);
    }
  });

  useEffect(() => {
    const prevOrder = prevOrderRef.current;

    // 첫 렌더면 이전 순서만 기록하고 끝
    if (!prevOrder.length) {
      prevOrderRef.current = rows.map((r) => r.id);
      return;
    }

    const prevIndexMap: Record<string, number> = {};
    prevOrder.forEach((id, idx) => {
      prevIndexMap[id] = idx;
    });

    // 새 rows 기준으로 인덱스 바뀐 애들만 애니메이션
    rows.forEach((row, newIdx) => {
      const prevIdx = prevIndexMap[row.id];
      if (prevIdx == null || prevIdx === newIdx) return;

      const diffIndex = prevIdx - newIdx; // +면 위로, -면 아래로 이동
      const translateY = animMap[row.id];

      // 이전 위치에서 시작
      translateY.setValue(diffIndex * ROW_HEIGHT);

      // 0으로 스르륵
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    // 이번 순서를 다음 렌더의 "이전 순서"로 저장
    prevOrderRef.current = rows.map((r) => r.id);
  }, [rows, animMap]);

  const renderItem = ({ item }: { item: RankingRow }) => {
    const translateY = animMap[item.id] ?? new Animated.Value(0);

    // ⬇⬇⬇ 핵심 변경 부분: 부모가 내려준 highlightedFamilies를 이용
    const direction = highlightedFamilies[item.id]; // 'up' | 'down' | undefined

    const rowBgStyle =
      direction === 'up'
        ? styles.rankRowUp
        : direction === 'down'
          ? styles.rankRowDown
          : styles.rankRow;

    const changeIcon =
      direction === 'up'
        ? require('../../assets/images/up.png')
        : direction === 'down'
          ? require('../../assets/images/down.png')
          : null;
    // ⬆⬆⬆ 여기까지

    return (
      <Animated.View
        style={[
          styles.rowContainer,
          rowBgStyle,
          { transform: [{ translateY }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onPressRow?.(item)}
          style={styles.rankRowTouchable}
        >
          {/* 왼쪽: 순위 + 아이콘 */}
          <View style={styles.rankRowLeft}>
            <Text style={styles.rankNumberText}>{item.rank}</Text>
            {changeIcon ? (
              <Image source={changeIcon} style={styles.rankChangeIcon} />
            ) : (
              <Text style={styles.rankChangeText}>-</Text>
            )}
          </View>

          {/* 가운데: 가족 이름 */}
          <View style={styles.rankRowCenter}>
            <Text style={styles.rankFamilyName}>{item.familyName}</Text>
          </View>

          {/* 오른쪽: 점수 */}
          <View style={styles.rankRowRight}>
            <Text style={styles.rankScoreText}>
              +{item.score.toLocaleString()}p
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={rows}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      contentContainerStyle={styles.rankingAll}
    />
  );
}

const styles = StyleSheet.create({
  rankingAll: {
    marginTop: 16,
  },
  rowContainer: {
    marginBottom: 10,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 23,
  },
  rankRow: {
    backgroundColor: '#FFFFFF',
  },
  rankRowUp: {
    backgroundColor: 'rgba(255, 120, 120, 0.25)',
  },
  rankRowDown: {
    backgroundColor: 'rgba(120, 140, 255, 0.25)',
  },
  rankRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
});

export default RankingList;
