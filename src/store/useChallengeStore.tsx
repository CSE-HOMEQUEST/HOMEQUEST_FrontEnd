// src/store/useChallengeStore.tsx
import { create } from 'zustand';

import { auth } from '@/src/firebase/firebase';
import { challengeService } from '@/src/services/challengeService';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useRewardStore } from '@/src/store/useRewardStore';

/** 공통 타입 */
export type Filter = '전체' | '절약' | '가사' | '헬스' | '나' | '가족';

export type Challenge = {
  id: string; // challengeId (템플릿/진행 공통 ID)
  progressId?: string; // 진행 문서 id (Firestore progress 문서 id)
  category: Filter; // audience 용 ('나' | '가족')
  domainCategory?: Filter; // 절약/가사/헬스 같은 도메인 카테고리

  title: string;
  status: 'ongoing' | 'recommended' | 'completed' | 'failed';
  progressPct?: number;
  rewardPoints?: number;
  duration?: number;

  durationType?: string; // 'daily' | 'weekly' | 'monthly' ...
  recommendedTimeSlot?: string; // '14:00', 'evening' ...

  currentValue?: number;
  targetValue?: number;
  unit?: string; // '회', '잔', '분' 같은 단위

  // 완료 챌린지 정보 (홈 TodayReportPopup에서 사용)
  completedAt?: string; // 'YYYY-MM-DD'
  // 난이도 (firebase에 level 넣어두면 읽어옴)
  level?: 1 | 2 | 3; // easy | medium | hard로 맵핑 필요 !!
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

  // 완료된 챌린지 목록
  completed: Challenge[];

  // 효과 관련(홈 진 glow 등)
  effects: {
    // 마지막으로 완료된 주체: 진/동/없음
    lastCompleted: 'jin' | 'dong' | null;
  };
};

type Actions = {
  setFilter: (f: Filter) => void;
  hydrate: () => Promise<void>;
  fetchRecommended: (opts?: { cursor?: string | null }) => Promise<void>;
  startChallenge: (id: string) => Promise<void>;
  updateProgress: (id: string, pct: number) => void;
  completeChallenge: (id: string) => Promise<{
    isCompleted: boolean;
    rewardPoints: number;
    remainingValue: number;
    unit?: string;
  } | void>;
  dismissRecommendation: (id: string) => Promise<void>;

  // 홈 glow 리셋용
  resetEffect: () => void;
};

const mapFsCategoryToFilter = (fsCategory?: string | null): Filter => {
  switch (fsCategory) {
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

/** Store 생성 */
export const useChallengeStore = create<State & Actions>((set, get) => ({
  currentFilter: '전체',
  ongoing: [],
  recommended: [],
  recCursor: null,
  loading: { init: true, recMore: false, refresh: false },
  error: null,
  completed: [],
  effects: {
    lastCompleted: null,
  },

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
      console.log('[store.hydrate] START');

      // 0) authStore에서 uid / familyId 가져오기 + Firebase auth fallback
      const { user, token } = useAuthStore.getState();
      const fbUser = auth.currentUser;
      const uid = token ?? fbUser?.uid ?? null;
      const familyId = user?.familyId ?? null;

      console.log('[store.hydrate] uid =', uid, 'familyId =', familyId);

      if (!uid) {
        console.log('[store.hydrate] no uid, skip getAllOngoing');
        set((s) => ({ ...s, loading: { ...s.loading, init: false } }));
        return;
      }

      // 1) Firestore에서 읽기
      const ongoingRaw = await challengeService.getAllOngoing({
        uid,
        familyId,
      });
      console.log('🔥 hydrate | ongoingRaw:', ongoingRaw);

      // 기존 추천 불러오기 주석 처리 -> AI 추천으로 대체
      // const recPage = await challengeService.getRecommended({
      //   cursor: null,
      // });
      // console.log('🔥 hydrate | recommendedRaw:', recPage.items);

      // 1차 시도: AI 기반 개인화 추천
      let recPage: { items: any[]; cursor: string | null };
      try {
        recPage = await challengeService.getAiRecommended({ uid });
        console.log('🔥 hydrate | AI recommendedRaw:', recPage.items);
      } catch (e) {
        console.log('[store.hydrate] AI 추천 실패, 기본 추천으로 fallback:', e);
        // 실패하면 기존 getRecommended 사용
        recPage = await challengeService.getRecommended({ cursor: null });
        console.log('🔥 hydrate | fallback recommendedRaw:', recPage.items);
      }

      // 2) 우리 앱 Challenge 타입으로 변환
      const ongoing: Challenge[] = ongoingRaw.map((d: any) => {
        const isPersonal = d.mode === 'personal';

        const title: string = d.title ?? d.challengeTitle ?? '';

        // audience (나/가족)
        const audienceCategory: Filter = isPersonal ? '나' : '가족';

        // 절약/가사/헬스
        const domainCategory: Filter = mapFsCategoryToFilter(
          d.challengeCategory as string | undefined,
        );

        // duration / time / current/target/unit
        const durationType: string | undefined = d.durationType;
        const recommendedTimeSlot: string | undefined = d.recommendedTimeSlot;
        const currentValue: number =
          typeof d.currentValue === 'number' ? d.currentValue : 0;
        const targetValue: number | undefined =
          typeof d.targetValue === 'number' ? d.targetValue : undefined;
        const unit: string = (d.unit as string) ?? '';

        const progressPct: number =
          typeof d.progressPct === 'number'
            ? d.progressPct
            : targetValue
              ? Math.min(
                  Math.floor(((currentValue ?? 0) / targetValue) * 100),
                  100,
                )
              : 0;

        // 진행 문서에서는 rewardPersonalPoints / rewardFamilyPoints 기준으로 보상 표시
        const rewardPoints: number = isPersonal
          ? (d.rewardPersonalPoints ?? d.basePersonalPoints ?? 0)
          : (d.rewardFamilyPoints ?? d.baseFamilyPoints ?? 0);

        return {
          id: d.challengeId,
          progressId: d.progressId,
          title,
          category: audienceCategory, // 나/가족
          domainCategory, // 절약/가사/헬스/전체
          status: 'ongoing',
          durationType,
          recommendedTimeSlot,
          currentValue,
          targetValue,
          unit,
          progressPct,
          rewardPoints,
        };
      });

      const recommended: Challenge[] = recPage.items.map((dto: any) => {
        const audienceCategory: Filter =
          dto.mode === 'personal' ? '나' : '가족';
        const domainCategory: Filter = mapFsCategoryToFilter(dto.category);

        return {
          id: dto.id,
          title: dto.title,
          category: audienceCategory, // 나/가족
          domainCategory, // 절약/가사/헬스/전체
          status: 'recommended',
          rewardPoints:
            dto.mode === 'personal'
              ? dto.basePersonalPoints
              : dto.baseFamilyPoints,
          durationType: dto.durationType,
          recommendedTimeSlot: dto.recommendedTimeSlot,
        };
      });

      console.log('🔥 hydrate | mapped ongoing:', ongoing);
      console.log('🔥 hydrate | mapped recommended:', recommended);

      set((s) => ({
        ongoing,
        recommended,
        recCursor: recPage.cursor ?? null,
        loading: { ...s.loading, init: false },
      }));
    } catch (e: any) {
      console.log('[store.hydrate] ERROR:', e);
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
        cursor: null,
      });

      const more: Challenge[] = page.items.map((dto: any) => {
        const audienceCategory: Filter =
          dto.mode === 'personal' ? '나' : '가족';
        const domainCategory: Filter = mapFsCategoryToFilter(dto.category);

        return {
          id: dto.id,
          title: dto.title,
          category: audienceCategory, // 나/가족
          domainCategory, // 절약/가사/헬스/전체
          status: 'recommended',
          rewardPoints:
            dto.mode === 'personal'
              ? dto.basePersonalPoints
              : dto.baseFamilyPoints,
          durationType: dto.durationType,
          recommendedTimeSlot: dto.recommendedTimeSlot,
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
      - challengeService.completeChallenge
        -> progress + contributions + user/family 전역 포인트
        -> { rewardPoints, category, title, isCompleted }
  ----------------------------- */
  completeChallenge: async (id) => {
    const res = await challengeService.completeChallenge(id);
    const {
      rewardPoints,
      category,
      title,
      isCompleted,
      currentValue,
      targetValue,
      unit,
    } = res as any;

    const state = get();
    const rewardStore = useRewardStore.getState();
    const { hydrate } = get();

    const todayDot = new Date().toISOString().slice(0, 10).replace(/-/g, '.'); // 히스토리용
    const todayStr = new Date().toISOString().slice(0, 10); // completedAt 용 (YYYY-MM-DD)

    // 1) 항상 ongoing 리스트의 진행도/값 먼저 업데이트 (완료 여부와 상관없이)
    set((s) => {
      const updatedOngoing = s.ongoing.map((c) => {
        if (c.id !== id) return c;

        const newCurrent =
          typeof currentValue === 'number'
            ? currentValue
            : (c.currentValue ?? 0);
        const newTarget =
          typeof targetValue === 'number' && targetValue > 0
            ? targetValue
            : c.targetValue;

        const pct =
          newTarget && newTarget > 0
            ? Math.min(Math.floor((newCurrent / newTarget) * 100), 100)
            : (c.progressPct ?? 0);

        return {
          ...c,
          currentValue: newCurrent,
          targetValue: newTarget,
          unit: unit ?? c.unit,
          progressPct: pct,
        };
      });

      return { ...s, ongoing: updatedOngoing };
    });

    const safeTarget = typeof targetValue === 'number' ? targetValue : 0;
    const safeCurrent = typeof currentValue === 'number' ? currentValue : 0;
    const remainingValue =
      safeTarget > 0 ? Math.max(safeTarget - safeCurrent, 0) : 0;

    // 2) 아직 완주 전이면: 포인트/상태 이동 없이 팝업용 정보만 리턴
    if (!isCompleted || rewardPoints <= 0) {
      console.log(
        '[useChallengeStore.completeChallenge] not fully completed yet',
        {
          id,
          rewardPoints,
          category,
          title,
          isCompleted,
          currentValue,
          targetValue,
        },
      );

      await hydrate();

      return {
        isCompleted,
        rewardPoints,
        remainingValue,
        unit,
      };
    }

    // 3) 완주한 경우: 리워드 반영
    if (category === '나') {
      rewardStore.setMyReward({
        currentPoint: rewardStore.myPoint + rewardPoints,
        expectedPoint: state.ongoing
          .filter((c) => c.id !== id)
          .reduce((s, c) => s + (c.rewardPoints ?? 0), 0),
      });
      rewardStore.addMyHistory({
        id: Date.now(),
        date: todayDot,
        label: title,
        point: rewardPoints,
        type: 'earn',
      });
    } else if (category === '가족') {
      rewardStore.setFamilyReward({
        total: rewardStore.familyTotal + rewardPoints,
        weeklyRank: rewardStore.weeklyRank,
        monthlyRank: rewardStore.monthlyRank,
      });
      rewardStore.addFamilyHistory({
        id: Date.now(),
        date: todayDot,
        label: title,
        point: rewardPoints,
        type: 'earn',
      });
    }

    // 4) ongoing → completed 이동 + 다시 recommended에 재투입
    set((s) => {
      const target = s.ongoing.find((c) => c.id === id);
      const remaining = s.ongoing.filter((c) => c.id !== id);

      const completedItem: Challenge | undefined = target
        ? {
            ...target,
            status: 'completed',
            rewardPoints,
            completedAt: todayStr,
          }
        : undefined;

      const nextCompleted = completedItem
        ? [...s.completed, completedItem]
        : s.completed;

      const lastCompleted =
        category === '나'
          ? 'jin'
          : category === '가족'
            ? 'dong'
            : s.effects.lastCompleted;

      // 1) 기존 recommended에서 같은 id 제거
      const filteredRecommended = s.recommended.filter((c) => c.id !== id);

      // 2) 다시 추천 리스트에 넣어주기 (리셋된 상태로)
      const reRecommendedItem: Challenge | undefined = target
        ? {
            ...target,
            status: 'recommended',
            progressPct: 0,
            currentValue: 0,
            targetValue: target.targetValue,
            completedAt: undefined,
          }
        : undefined;

      const nextRecommended = reRecommendedItem
        ? [...filteredRecommended, reRecommendedItem]
        : filteredRecommended;

      return {
        ongoing: remaining,
        completed: nextCompleted,
        recommended: nextRecommended,
        effects: {
          ...s.effects,
          lastCompleted,
        },
      };
    });

    await hydrate();

    // 5) UI(Detail)에서 팝업에 쓸 정보 리턴
    return {
      isCompleted,
      rewardPoints,
      remainingValue: 0,
      unit,
    };
  },

  /* -----------------------------
      추천 제거(dismiss)
  ----------------------------- */
  dismissRecommendation: async (id) => {
    set((s) => ({
      recommended: s.recommended.filter((c) => c.id !== id),
    }));
  },

  /* -----------------------------
      효과 초기화 (홈 glow 끄기)
  ----------------------------- */
  resetEffect: () => {
    set((s) => ({
      effects: {
        ...s.effects,
        lastCompleted: null,
      },
    }));
  },
}));
