import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '@/src/constants/colors';

export default function ChallengeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>HomeQuest</Text>
        <View style={styles.headerIconPlaceholder} />
      </View>

      {/* CategoryFilterGroup */}
      <View style={styles.categoryFilterGroup}>
        <View style={styles.categoryRow}>
          <View style={styles.chipActive}>
            <Text style={styles.chipActiveText}>나</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>가족</Text>
          </View>
        </View>

        <View style={styles.categoryRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>전체</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>절약</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>가사</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>헬스</Text>
          </View>
        </View>
      </View>

      {/* 나의 챌린지 현황 + MissionStatsCard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>나의 챌린지 현황</Text>
        <View style={styles.missionStatsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50</Text>
            <Text style={styles.statLabel}>참여한 미션</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>34</Text>
            <Text style={styles.statLabel}>성공한 미션</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>68%</Text>
            <Text style={styles.statLabel}>미션 성공률</Text>
          </View>
        </View>
      </View>

      {/* 진행중인 챌린지 영역 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>진행중인 챌린지</Text>
        {/* TODO: 카드 리스트 (가로 스크롤) */}
        <View style={styles.placeholderCardRow}>
          <Text style={styles.placeholderText}>
            여기에 진행중인 챌린지 카드들
          </Text>
        </View>
      </View>

      {/* 추천 챌린지 영역 */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>추천 챌린지</Text>
          <Text style={styles.refreshText}>↻</Text>
        </View>

        <View style={styles.recommendCard}>
          <Text style={styles.recommendTitle}>식기세척기 돌리기</Text>
          <Text style={styles.recommendSubtitle}>40p 받기</Text>
        </View>

        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
  },
  categoryFilterGroup: {
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f2f2f2',
  },
  chipActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chipText: {
    color: '#999',
  },
  chipActiveText: {
    color: '#000',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  missionStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  placeholderCardRow: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshText: {
    fontSize: 16,
  },
  recommendCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendSubtitle: {
    fontSize: 13,
    color: '#f39c12',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.tint,
  },
});
