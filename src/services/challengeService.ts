// src/services/challengeService.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { auth, db } from '@/src/firebase/firebase';
import type { Filter } from '@/src/store/useChallengeStore';

type Period = 'daily' | 'weekly' | 'monthly' | 'relay' | 'speed';

// 챌린지 템플릿 DTO
export type ChallengeDto = {
  id: string;
  title: string;
  mode: 'personal' | 'family';
  category: string; // 'chores' | 'health' | ...
  basePersonalPoints?: number;
  baseFamilyPoints?: number;
  createdAt?: string;
};

// ChallengeProgressDto (progress 문서 타입)
export type ChallengeProgressDoc = {
  progressId: string; // 문서 id
  challengeId: string;
  challengeTitle?: string;
  title?: string;
  challengeCategory?: string;
  mode?: 'personal' | 'family';

  status?: 'ONGOING' | 'COMPLETED' | 'FAILED';

  currentValue?: number;
  targetValue?: number;
  progressPct?: number;

  totalEnergyKwh?: number;
  totalPersonalPoints?: number;
  totalFamilyPoints?: number;

  // 필요하면 나머지 필드도
  deviceType?: string;
  durationType?: string;
  progressType?: string;
  recommendedTimeSlot?: string;
};

const mapDocToDto = (
  snap: QueryDocumentSnapshot<unknown, DocumentData>,
): ChallengeDto => {
  const d = snap.data() as DocumentData;

  return {
    id: snap.id,
    title: (d.title as string) ?? '',
    mode: (d.mode as 'personal' | 'family') ?? 'personal',
    category: (d.category as string) ?? 'chores',
    basePersonalPoints: (d.basePersonalPoints as number) ?? 0,
    baseFamilyPoints: (d.baseFamilyPoints as number) ?? 0,
    createdAt: d.createdAt as string | undefined,
  };
};

const mapFilterToFsCategory = (filter: Filter): string | null => {
  switch (filter) {
    case '절약':
      return 'saving';
    case '가사':
      return 'chores';
    case '헬스':
      return 'health';
    default:
      return null;
  }
};

// 🔹 startChallenge에서 사용할 targetValue 계산 함수
function getTargetValueByChallengeId(challengeId: string): number {
  switch (challengeId) {
    case 'daily_water_2':
      return 2; // 예: 한 달 동안 30번 수행
    case 'monthly_heating':
      return 100; // 예: 한 달간 난방 절약 성공 1회
    case 'speed_dishwasher':
      return 1; // 예: 한 주에 4회 릴레이
    default:
      return 1;
  }
}

export const challengeService = {
  /** 진행중인 챌린지: /users/{uid}/challenges 에서 읽기 */
  async getOngoing() {
    const user = auth.currentUser;
    if (!user) {
      console.log('🚨 [getOngoing] user is NULL → 로그인 필요 상태');
      return [];
    }

    const colRef = collection(db, 'users', user.uid, 'challengeProgress');

    // status == 'ONGOING' 인 것만
    const q = query(colRef, where('status', '==', 'ONGOING'));
    const snap = await getDocs(q);

    // progress 문서 id도 같이 넘겨줌 (progressId)
    return snap.docs.map((d) => ({
      progressId: d.id,
      ...(d.data() as any),
    })) as ChallengeProgressDoc[];
    // 여기서는 raw 데이터로 내보내고, store에서 앱 타입으로 변환
  },

  /** 추천 챌린지: /challenges 템플릿에서 읽기 */
  async getRecommended(opts: { filter: Filter; cursor?: string | null }) {
    const { filter, cursor } = opts;
    const colRef = collection(db, 'challenges');
    const fsCategory = mapFilterToFsCategory(filter);

    let qAny: any = query(colRef, orderBy('createdAt', 'desc'), limit(10));
    if (fsCategory) {
      qAny = query(qAny, where('category', '==', fsCategory));
    }
    if (cursor) {
      qAny = query(qAny, startAfter(cursor));
    }

    const snap = await getDocs(qAny);
    const items = snap.docs.map(mapDocToDto);
    const last = snap.docs[snap.docs.length - 1];
    const lastData = last?.data() as { createdAt?: string } | undefined;
    const nextCursor = lastData?.createdAt ?? null;

    return { items, cursor: nextCursor as string | null };
  },

  /** 도전 시작 */
  /** 도전 시작 */
  async startChallenge(challengeId: string) {
    console.log('🔥 [startChallenge] called with challengeId =', challengeId);
    console.log('🔥 [startChallenge] auth.currentUser =', auth.currentUser);

    const user = auth.currentUser;
    if (!user) {
      console.log('🚨 [startChallenge] user is NULL → 로그인 필요 던짐');
      throw new Error('로그인 필요');
    }

    // 1) 챌린지 템플릿 읽기
    const tmplRef = doc(db, 'challenges', challengeId);
    const tmplSnap = await getDoc(tmplRef);
    if (!tmplSnap.exists()) throw new Error('챌린지 템플릿 없음');

    const d = tmplSnap.data() as any;
    const isPersonal = d.mode === 'personal';

    // 🔹 durationType 정리 (daily / weekly / monthly / relay / speed)
    const rawDuration = d.durationType as string | undefined;

    let durationType: Period = 'daily';
    if (
      rawDuration === 'weekly' ||
      rawDuration === 'monthly' ||
      rawDuration === 'relay' ||
      rawDuration === 'speed'
    ) {
      durationType = rawDuration;
    }

    // 🔹 목표/현재 값 설정
    const targetValue = getTargetValueByChallengeId(challengeId);
    const currentValue = 0; // ✅ 시작 시에는 항상 0

    // 2) 진행중 챌린지 생성: users/{uid}/challengeProgress
    const progressCol = collection(db, 'users', user.uid, 'challengeProgress');

    await addDoc(progressCol, {
      userId: user.uid,
      challengeId,
      challengeTitle: d.title,
      mode: d.mode ?? (isPersonal ? 'personal' : 'family'),
      category: d.category, // saving / chores / health 또는 '절약' 같은 값

      durationType, // ✅ 여기서 period 저장 (daily / monthly / speed 등)

      status: 'ONGOING',
      rewardPoints: isPersonal
        ? (d.basePersonalPoints ?? 0)
        : (d.baseFamilyPoints ?? 0),

      // ✅ 게이지 계산용
      currentValue, // 지금까지 완료 횟수 (0부터 시작)
      targetValue, // 목표 횟수
      progressPct: 0,
      startedAt: serverTimestamp(),
    });
  },

  /** 진행중 챌린지 모두 리셋(삭제) - 개발/시연용 유틸 */
  async resetUserChallenges() {
    const user = auth.currentUser;
    if (!user) {
      console.log('🚨 [resetUserChallenges] user is NULL');
      return;
    }

    // 진행중 챌린지들이 들어있는 컬렉션 경로: users/{uid}/challengeProgress
    const colRef = collection(db, 'users', user.uid, 'challengeProgress');
    const snap = await getDocs(colRef);

    if (snap.empty) {
      console.log('✅ [resetUserChallenges] 삭제할 문서 없음');
      return;
    }

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.delete(d.ref);
    });

    await batch.commit();
    console.log(
      `🔥 [resetUserChallenges] ${snap.docs.length}개 진행중 챌린지 삭제 완료`,
    );
  },

  /** 🔹 유저가 숨긴(삭제한) 추천 챌린지 기록 */
  async dismissRecommendedChallenge(challengeId: string) {
    const user = auth.currentUser;
    if (!user) {
      console.log('[dismissRecommendedChallenge] no user');
      return;
    }

    const colRef = collection(db, 'users', user.uid, 'dismissedRecommended');
    // challengeId 를 문서 id로 쓰면, 같은 걸 여러 번 저장하지 않아도 됨
    const docRef = doc(colRef, challengeId);

    await setDoc(docRef, {
      challengeId,
      dismissedAt: serverTimestamp(),
    });
  },

  /** 🔹 유저가 숨긴 추천 챌린지 목록 불러오기 */
  async getDismissedRecommendedIds(): Promise<string[]> {
    const user = auth.currentUser;
    if (!user) {
      console.log('[getDismissedRecommendedIds] no user');
      return [];
    }

    const colRef = collection(db, 'users', user.uid, 'dismissedRecommended');
    const snap = await getDocs(colRef);

    return snap.docs.map((d) => {
      const data = d.data() as any;
      return (data.challengeId as string) ?? d.id;
    });
  },

  /** 완료 처리: user-challenge 문서 업데이트 + 포인트 리턴 */
  async completeChallenge(challengeId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인 필요');

    const colRef = collection(db, 'users', user.uid, 'challenges');
    const q = query(
      colRef,
      where('challengeId', '==', challengeId),
      where('status', '==', 'ONGOING'),
    );
    const snap = await getDocs(q);
    if (snap.empty)
      return {
        rewardPoints: 0,
        category: '나',
        title: '',
      };

    const docSnap = snap.docs[0];
    const data = docSnap.data() as any;

    await updateDoc(docSnap.ref, {
      status: 'COMPLETED',
      completedAt: serverTimestamp(),
      progressPct: 100,
    });

    return {
      rewardPoints: (data.rewardPoints as number) ?? 0,
      category: data.category as Filter, // '나' | '가족'
      title: data.title as string,
    };
  },
};
