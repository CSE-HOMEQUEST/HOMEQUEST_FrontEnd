// src/store/useChallengeStore.ts
import { create } from 'zustand';

/** 공통 타입 */
export type Filter = '전체' | '절약' | '가사' | '헬스' | '나' | '가족';

export type Challenge = {
  id: string;
  title: string;
  category: Filter;
  status: 'ongoing' | 'recommended' | 'completed' | 'failed';
  progressPct?: number;
  rewardPoints?: number;
  duration?: number;
};

export type Page<T> = { items: T[]; cursor?: string | null };

/** 임시 api 스텁(실서버 연결 전까지) */
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
    new Promise((r) =>
      setTimeout(
        () =>
          r({
            items: [],
            cursor: null, // 더 없음
          }),
        150,
      ),
    ),
  startChallenge: async (_: { id: string }) =>
    new Promise((r) => setTimeout(r, 150)),
  completeChallenge: async (_: { id: string }) =>
    new Promise<{ rewardPoints: number }>((r) =>
      setTimeout(() => r({ rewardPoints: 40 }), 150),
    ),
  dismiss: async (_: { id: string }) => new Promise((r) => setTimeout(r, 100)),
};

/** 상태와 액션을 분리 */
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

export const useChallengeStore = create<State & Actions>((set, get) => ({
  // 초기 상태
  currentFilter: '전체',
  ongoing: [],
  recommended: [],
  recCursor: null,
  loading: { init: true, recMore: false, refresh: false },
  error: null,

  // 액션
  setFilter: (f) => set({ currentFilter: f, recommended: [], recCursor: null }),

  hydrate: async () => {
    set((s) => ({ loading: { ...s.loading, init: true }, error: null }));
    try {
      const ongoing = await api.getOngoing();
      const recPage = await api.getRecommended({ filter: get().currentFilter });
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

  fetchRecommended: async ({ cursor } = {}) => {
    const cur = cursor ?? get().recCursor;
    if (cur === null) return; // 더 불러올 것 없음
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

  startChallenge: async (id) => {
    await api.startChallenge({ id });
    set((s) => {
      const rec = s.recommended.filter((c) => c.id !== id);
      const started = s.recommended.find((c) => c.id === id);
      return started
        ? {
            recommended: rec,
            ongoing: [
              { ...started, status: 'ongoing', progressPct: 0 },
              ...s.ongoing,
            ],
          }
        : { recommended: rec };
    });
  },

  updateProgress: (id, pct) =>
    set((s) => ({
      ongoing: s.ongoing.map((c) =>
        c.id === id ? { ...c, progressPct: pct } : c,
      ),
    })),

  completeChallenge: async (id) => {
    await api.completeChallenge({ id });
    set((s) => ({ ongoing: s.ongoing.filter((c) => c.id !== id) }));
  },

  dismissRecommendation: async (id) => {
    await api.dismiss({ id });
    set((s) => ({ recommended: s.recommended.filter((c) => c.id !== id) }));
  },
}));
