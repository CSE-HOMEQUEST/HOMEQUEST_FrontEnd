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

  // 🔵 난이도 (firebase에 level 넣어두면 읽어옴)
  level?: 'easy' | 'normal' | 'hard';
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

  // 🔵 실시간 구독 해제용
  personalUnsub?: () => void;
  familyUnsub?: () => void;
};

type Actions = {
  setFilter: (f: Filter) => void;
  hydrate: () => Promise<void>;
  fetchRecommended: (opts?: { cursor?: string | null }) => Promise<void>;
  startChallenge: (id: string) => Promise<void>;
  updateProgress: (id: string, pct: number) => void;
  completeChallenge: (id: string) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;

  // 효과 초기화 (홈 glow 끄기)
  resetEffect: () => void;

  // 🔵 실시간 구독 시작
  subscribeRealtimePersonal: () => void;
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

function mapRawToChallenge(d: any): Challenge {
  const isPersonal = d.mode === 'personal';

  const title: string = d.title ?? d.challengeTitle ?? '';

  // audience (나/가족)
  const audienceCategory: Filter = isPersonal ? '나' : '가족';

  // 절약/가사/헬스
  const domainCategory: Filter = mapFsCategoryToFilter(
    d.challengeCategory as string | undefined,
  );

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
      : d.targetValue
        ? Math.min(
            Math.floor(((d.currentValue ?? 0) / d.targetValue) * 100),
            100,
          )
        : 0;

  const rewardPoints: number =
    d.rewardPoints ?? d.totalPersonalPoints ?? d.totalFamilyPoints ?? 0;

  // 🔵 여기서 level 읽기 (progress 문서에 level 필드 있다고 가정)
  const level = d.level as 'easy' | 'normal' | 'hard' | undefined;

  return {
    id: d.challengeId,
    progressId: d.progressId,
    title,
    category: audienceCategory,
    domainCategory,
    status:
      (d.status === 'COMPLETED'
        ? 'completed'
        : d.status === 'FAILED'
          ? 'failed'
          : 'ongoing') ?? 'ongoing',
    durationType,
    recommendedTimeSlot,
    currentValue,
    targetValue,
    unit,
    progressPct,
    rewardPoints,
    level,
  };
}

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

  personalUnsub: undefined,
  familyUnsub: undefined,

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

      // authStore에서 uid / familyId 가져오기 + Firebase auth fallback
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

      // Firestore에서 읽기
      const ongoingRaw = await challengeService.getAllOngoing({
        uid,
        familyId,
      });
      const recPage = await challengeService.getRecommended({
        cursor: null,
      });

      console.log('🔥 hydrate | ongoingRaw:', ongoingRaw);
      console.log('🔥 hydrate | recommendedRaw:', recPage.items);

      const ongoing: Challenge[] = ongoingRaw.map((d: any) =>
        mapRawToChallenge(d),
      );

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
    챌린지 시작 (Firestore에만 맡김)
----------------------------- */
  startChallenge: async (id) => {
    // 1) Firestore에 진행 문서 생성/갱신
    await challengeService.startChallenge(id);

    // 2) (스토어 안 recommended를 쓰는 경우 대비) 동일 id 추천은 제거만
    set((s) => ({
      recommended: s.recommended.filter((c) => c.id !== id),
    }));
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

    const state = get();
    const rewardStore = useRewardStore.getState();

    // 히스토리용(점수 기록): YYYY.MM.DD
    const todayDot = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
    // 챌린지 완료일(홈 TodayReportPopup용): YYYY-MM-DD
    const todayStr = new Date().toISOString().slice(0, 10);

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

    // ongoing에서 제거 + completed에 추가 + glow 효과 상태 설정
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

      return {
        ongoing: remaining,
        completed: nextCompleted,
        effects: {
          ...s.effects,
          lastCompleted,
        },
      };
    });
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
  /* -----------------------------
    🔵 개인/가족 챌린지 실시간 구독
----------------------------- */
  subscribeRealtimePersonal: () => {
    const { personalUnsub, familyUnsub } = get();
    if (personalUnsub || familyUnsub) {
      console.log('[useChallengeStore] already subscribed (personal/family)');
      return;
    }

    const { user } = useAuthStore.getState();
    const fbUser = auth.currentUser;

    if (!fbUser) {
      console.log(
        '[useChallengeStore.subscribeRealtimePersonal] no auth.currentUser',
      );
      return;
    }

    const uid = fbUser.uid;
    const familyId = user?.familyId;

    console.log(
      '[useChallengeStore.subscribeRealtimePersonal] start for uid =',
      uid,
      'familyId =',
      familyId,
    );

    // 🔵 1) 개인 챌린지 실시간 구독
    const personalUnsubFn = challengeService.subscribePersonalOngoing(
      uid,
      (personalDocs: any[]) => {
        console.log(
          '[useChallengeStore] realtime personal ongoing =',
          personalDocs,
        );

        const personalChallenges: Challenge[] = personalDocs.map((d: any) =>
          mapRawToChallenge(d),
        );

        // 기존 ongoing 중 '가족' 챌린지는 유지, '나'만 실시간 값으로 교체
        set((s) => ({
          ...s,
          ongoing: [
            // 먼저 가족 챌린지들 유지
            ...s.ongoing.filter((c) => c.category === '가족'),
            // 그 위에 개인 챌린지 실시간 값
            ...personalChallenges,
          ],
        }));
      },
    );

    let familyUnsubFn: (() => void) | undefined;

    // 🔵 2) 가족 챌린지 실시간 구독 (familyId 가 있을 때만)
    if (familyId) {
      familyUnsubFn = challengeService.subscribeFamilyOngoing(
        familyId,
        (familyDocs: any[]) => {
          console.log(
            '[useChallengeStore] realtime family ongoing =',
            familyDocs,
          );

          const familyChallenges: Challenge[] = familyDocs.map((d: any) =>
            mapRawToChallenge(d),
          );

          // 기존 ongoing 중 '나' 챌린지는 유지, '가족'만 실시간 값으로 교체
          set((s) => ({
            ...s,
            ongoing: [
              ...s.ongoing.filter((c) => c.category === '나'),
              ...familyChallenges,
            ],
          }));
        },
      );
    } else {
      console.log('[useChallengeStore] no familyId, skip family subscribe');
    }

    set({
      personalUnsub: personalUnsubFn,
      familyUnsub: familyUnsubFn,
    });
  },
}));
