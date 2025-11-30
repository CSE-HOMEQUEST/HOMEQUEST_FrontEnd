// src/store/useChallengeStore.tsx
import { create } from 'zustand';

import { challengeService } from '@/src/services/challengeService';
import { useRewardStore } from '@/src/store/useRewardStore';

/** 공통 타입 */

// 누가 하는지
export type Audience = '나' | '가족';

// 어떤 종류인지 (카테고리 필터)
export type Filter = '전체' | '절약' | '가사' | '헬스';

export type Challenge = {
  id: string;
  progressId?: string;
  title: string;
  audience: Audience;
  category: Filter;
  status: 'ongoing' | 'recommended' | 'completed' | 'failed';
  progressPct?: number;
  rewardPoints?: number;
  duration?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'relay';
};

export type Page<T> = { items: T[]; cursor?: string | null };

/** 상태 정의 */
type State = {
  currentFilter: Filter;
  ongoing: Challenge[];
  recommended: Challenge[];
  recCursor: string | null;
  loading: { init: boolean; recMore: boolean; refresh: boolean };
  error?: string | null;
};

type Actions = {
  setFilter: (f: Filter) => void;
  hydrate: () => Promise<void>;
  fetchRecommended: (opts?: { cursor?: string | null }) => Promise<void>;
  startChallenge: (id: string) => Promise<void>;
  updateProgress: (id: string, pct: number) => void;
  completeChallenge: (id: string) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;
};

/** Store 생성 */
export const useChallengeStore = create<State & Actions>((set, get) => ({
  currentFilter: '전체',
  ongoing: [],
  recommended: [],
  recCursor: null,
  loading: { init: true, recMore: false, refresh: false },
  error: null,

  /* -----------------------------
      필터 변경
  ----------------------------- */
  setFilter: (f) => set({ currentFilter: f, recommended: [], recCursor: null }),

  /* -----------------------------
      초기 로드(hydrate)
  ----------------------------- */
  hydrate: async () => {
    set((s) => ({ loading: { ...s.loading, init: true }, error: null }));

    try {
      // 1) Firestore에서 진행중 챌린지 읽기
      const ongoingRaw = await challengeService.getOngoing();

      console.log('🔥 hydrate | ongoingRaw:', ongoingRaw);

      const ongoing: Challenge[] = ongoingRaw.map((d: any) => {
        const isPersonal = d.mode === 'personal';

        // 🔹 진행률 계산용 값
        const cur = typeof d.currentValue === 'number' ? d.currentValue : 0;
        const target =
          typeof d.targetValue === 'number' && d.targetValue > 0
            ? d.targetValue
            : 1;

        const progressPct = Math.min(100, Math.floor((cur / target) * 100));
        console.log(
          '🔥 hydrate map check',
          ongoingRaw.map((d: any) => ({
            id: d.challengeId,
            cur: d.currentValue,
            target: d.targetValue,
            rawPct: d.progressPct,
          })),
        );

        // 🔹 Firestore category(saving/chores/health) → 화면용 필터(절약/가사/헬스)
        const categoryMap = (cat: string | undefined): Filter => {
          switch (cat) {
            case 'saving':
              return '절약';
            case 'chores':
              return '가사';
            case 'health':
              return '헬스';
            default:
              return '전체';
          }
        };

        return {
          id: d.challengeId,
          progressId: d.progressId,
          title: d.challengeTitle ?? d.title ?? '',
          audience: isPersonal ? '나' : '가족',
          category: categoryMap(d.category),
          period:
            (d.durationType as 'daily' | 'weekly' | 'monthly' | 'relay') ??
            'daily',
          status: 'ongoing',
          progressPct,
          rewardPoints:
            d.rewardPoints ??
            (isPersonal ? d.totalPersonalPoints : d.totalFamilyPoints) ??
            0,
        };
      });

      console.log('🔥 hydrate | mapped ongoing:', ongoing);

      set((s) => ({
        ongoing,
        loading: { ...s.loading, init: false },
      }));
    } catch (e: any) {
      set((s) => ({
        error: e?.message ?? '네트워크 오류',
        loading: { ...s.loading, init: false },
      }));
    }
  },

  /* -----------------------------
      추천 더 보기
  ----------------------------- */
  fetchRecommended: async ({ cursor } = {}) => {
    const cur = cursor ?? get().recCursor;
    if (cur === null) return;

    set((s) => ({ loading: { ...s.loading, recMore: true } }));
    try {
      const page = await challengeService.getRecommended({
        filter: get().currentFilter,
        cursor: cur,
      });

      const more: Challenge[] = page.items.map((dto: any) => {
        const audience: Audience = dto.mode === 'personal' ? '나' : '가족';

        let category: Filter = '전체';
        if (
          dto.category === '절약' ||
          dto.category === '가사' ||
          dto.category === '헬스'
        ) {
          category = dto.category;
        }

        return {
          id: dto.id,
          title: dto.title,
          audience,
          category,
          status: 'recommended',
          rewardPoints:
            dto.mode === 'personal'
              ? dto.basePersonalPoints
              : dto.baseFamilyPoints,
        };
      });

      set((s) => ({
        recommended: [...s.recommended, ...more],
        recCursor: page.cursor ?? null,
        loading: { ...s.loading, recMore: false },
      }));
    } catch (e: any) {
      set((s) => ({
        error: e?.message ?? '추천 로드 실패',
        loading: { ...s.loading, recMore: false },
      }));
    }
  },

  /* -----------------------------
      챌린지 시작
  ----------------------------- */
  startChallenge: async (id) => {
    await challengeService.startChallenge(id);

    set((s) => {
      const rec = s.recommended.filter((c) => c.id !== id);
      const started = s.recommended.find((c) => c.id === id);

      return started
        ? {
            recommended: rec,
            ongoing: [
              {
                ...started,
                status: 'ongoing',
                progressPct: 0,
                rewardPoints: started.rewardPoints ?? 0,
              },
              ...s.ongoing,
            ],
          }
        : { recommended: rec };
    });
  },

  /* -----------------------------
      진행률 업데이트 (프론트 상태만)
  ----------------------------- */
  updateProgress: (id, pct) =>
    set((s) => ({
      ongoing: s.ongoing.map((c) =>
        c.id === id ? { ...c, progressPct: pct } : c,
      ),
    })),

  /* -----------------------------
      챌린지 완료 처리
  ----------------------------- */
  completeChallenge: async (id) => {
    const res = await challengeService.completeChallenge(id);
    const { rewardPoints, category, title } = res;

    const actor: Audience = category === '나' ? '나' : '가족';

    const state = get();
    const rewardStore = useRewardStore.getState();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

    if (actor === '나') {
      rewardStore.setMyReward({
        currentPoint: rewardStore.myPoint + rewardPoints,
        expectedPoint: state.ongoing
          .filter((c) => c.id !== id)
          .reduce((s, c) => s + (c.rewardPoints ?? 0), 0),
      });
      rewardStore.addMyHistory({
        id: Date.now(),
        date: today,
        label: title,
        point: rewardPoints,
        type: 'earn',
      });
    } else if (actor === '가족') {
      rewardStore.setFamilyReward({
        total: rewardStore.familyTotal + rewardPoints,
        weeklyRank: rewardStore.weeklyRank,
        monthlyRank: rewardStore.monthlyRank,
      });
      rewardStore.addFamilyHistory({
        id: Date.now(),
        date: today,
        label: title,
        point: rewardPoints,
        type: 'earn',
      });
    }

    set((s) => ({
      ongoing: s.ongoing.filter((c) => c.id !== id),
    }));
  },

  /* -----------------------------
      추천 제거(dismiss)
  ----------------------------- */
  dismissRecommendation: async (id) => {
    set((s) => ({
      recommended: s.recommended.filter((c) => c.id !== id),
    }));
  },
}));
