// src/store/useChallengeStore.ts
import { create } from 'zustand';

import { useRewardStore } from '../store/useRewardStore';

/** 공통 타입 */
export type Filter = '전체' | '절약' | '가사' | '헬스' | '나' | '가족';

export type Challenge = {
  id: string;
  title: string;
  category: Filter; // ← 여기로 개인/가족 구분
  status: 'ongoing' | 'recommended' | 'completed' | 'failed';
  progressPct?: number;
  rewardPoints?: number;
  duration?: number;
};

export type Page<T> = { items: T[]; cursor?: string | null };

/** 임시 API */
const api = {
  getOngoing: async (): Promise<Challenge[]> =>
    new Promise((r) => setTimeout(() => r([]), 150)),

  getRecommended: async ({
    filter: _filter,
    cursor: _cursor,
  }: {
    filter: Filter;
    cursor?: string | null;
  }): Promise<Page<Challenge>> =>
    new Promise((r) => setTimeout(() => r({ items: [], cursor: null }), 150)),

  startChallenge: async (_: { id: string }) =>
    new Promise((r) => setTimeout(r, 150)),

  completeChallenge: async (_: { id: string }) =>
    new Promise<{ rewardPoints: number }>((r) =>
      setTimeout(() => r({ rewardPoints: 40 }), 150),
    ),

  dismiss: async (_: { id: string }) => new Promise((r) => setTimeout(r, 100)),
};

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
      const ongoing = await api.getOngoing();
      const recPage = await api.getRecommended({
        filter: get().currentFilter,
      });

      set((s) => ({
        ongoing,
        recommended: recPage.items,
        recCursor: recPage.cursor ?? null,
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
      const page = await api.getRecommended({
        filter: get().currentFilter,
        cursor: cur,
      });

      set((s) => ({
        recommended: [...s.recommended, ...page.items],
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
    await api.startChallenge({ id });

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
      진행률 업데이트
  ----------------------------- */
  updateProgress: (id, pct) =>
    set((s) => ({
      ongoing: s.ongoing.map((c) =>
        c.id === id ? { ...c, progressPct: pct } : c,
      ),
    })),

  /* -----------------------------
      챌린지 완료 처리
      (여기서 개인/가족 리워드 & 타임라인 분리됨)
  ----------------------------- */
  completeChallenge: async (id) => {
    const state = get();
    const target = state.ongoing.find((c) => c.id === id);
    if (!target) return;

    await api.completeChallenge({ id });

    const reward = target.rewardPoints ?? 0;
    const rewardStore = useRewardStore.getState();

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

    /* -----------------------------
          개인 챌린지인 경우
    ----------------------------- */
    if (target.category === '나') {
      rewardStore.setMyReward({
        currentPoint: rewardStore.myPoint + reward,
        expectedPoint: state.ongoing
          .filter((c) => c.id !== id)
          .reduce((s, c) => s + (c.rewardPoints ?? 0), 0),
      });

      rewardStore.addMyHistory({
        id: Date.now(),
        date: today,
        label: target.title,
        point: reward,
        type: 'earn',
      });
    } else if (target.category === '가족') {
      /* -----------------------------
          가족 챌린지인 경우
    ----------------------------- */
      rewardStore.setFamilyReward({
        total: rewardStore.familyTotal + reward,
        weeklyRank: rewardStore.weeklyRank,
        monthlyRank: rewardStore.monthlyRank,
      });

      rewardStore.addFamilyHistory({
        id: Date.now(),
        date: today,
        label: target.title,
        point: reward,
        type: 'earn',
      });
    }

    /* -----------------------------
         ongoing에서 제거
    ----------------------------- */
    set((s) => ({
      ongoing: s.ongoing.filter((c) => c.id !== id),
    }));
  },

  /* -----------------------------
      추천 제거(dismiss)
  ----------------------------- */
  dismissRecommendation: async (id) => {
    await api.dismiss({ id });
    set((s) => ({
      recommended: s.recommended.filter((c) => c.id !== id),
    }));
  },
}));
