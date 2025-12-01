// src/services/challengeService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  onSnapshot,
  QuerySnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { auth, db } from '@/src/firebase/firebase';
import type { Filter } from '@/src/store/useChallengeStore';

function summarizeChallengeSnap(snap: QuerySnapshot<DocumentData>) {
  let totalParticipated = 0;
  let totalCompleted = 0;

  snap.forEach((docSnap) => {
    const data = docSnap.data() as any;
    const status = (data.status as string) ?? 'ONGOING';

    // 참여한 미션: COMPLETED / FAILED 만 카운트
    if (status === 'COMPLETED' || status === 'FAILED') {
      totalParticipated += 1;
    }

    // 성공한 미션: COMPLETED
    if (status === 'COMPLETED') {
      totalCompleted += 1;
    }
  });

  const successRate =
    totalParticipated > 0
      ? Math.round((totalCompleted / totalParticipated) * 100)
      : 0;

  return { totalParticipated, totalCompleted, successRate };
}

// 챌린지 템플릿 DTO
export type ChallengeDto = {
  id: string;
  title: string;
  mode: 'personal' | 'family';
  category: string; // 'chores' | 'health' | ...
  basePersonalPoints?: number;
  baseFamilyPoints?: number;
  createdAt?: string;
  durationType?: string;
  recommendedTimeSlot?: string;
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
    durationType: d.durationType as string | undefined,
    recommendedTimeSlot: d.recommendedTimeSlot as string | undefined,
  };
};

export const challengeService = {
  // 1) getPersonalOngoing: 개인 진행중
  async getPersonalOngoing(uid: string) {
    const colRef = collection(db, 'users', uid, 'challengeProgress');
    const q = query(colRef, where('status', '==', 'ONGOING'));
    const snap = await getDocs(q);

    console.log(
      '[getPersonalOngoing] ONGOING docs =',
      snap.size,
      snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    );

    return snap.docs.map((d) => ({
      progressId: d.id,
      ...(d.data() as any),
      mode: 'personal' as const,
    }));
  },

  // 2) getFamilyOngoing: 가족 진행중
  async getFamilyOngoing(familyId: string) {
    const colRef = collection(db, 'families', familyId, 'challengeProgress');
    const q = query(colRef, where('status', '==', 'ONGOING'));
    const snap = await getDocs(q);

    console.log(
      '[getFamilyOngoing] ONGOING docs =',
      snap.size,
      snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    );

    return snap.docs.map((d) => ({
      progressId: d.id,
      ...(d.data() as any),
      mode: 'family' as const,
    }));
  },

  // 3) getAllOngoing: all 버전 래퍼
  async getAllOngoing(params: { uid: string; familyId?: string | null }) {
    const { uid, familyId } = params;

    const personal = await this.getPersonalOngoing(uid);
    const family = familyId ? await this.getFamilyOngoing(familyId) : [];
    console.log('[challengeService.getAllOngoing] result lengths =', {
      personal: personal.length,
      family: family.length,
    });

    return [...personal, ...family];
  },

  // 3.5) 🔵 개인 ONGOING 실시간 구독
  // 🔵 개인 진행 상황 실시간 구독
  subscribePersonalOngoing(
    uid: string,
    onChange: (docs: any[]) => void,
  ): () => void {
    const colRef = collection(db, 'users', uid, 'challengeProgress');

    // ✅ status 필터 제거 → 모든 문서 실시간 구독
    const qAny = query(colRef, orderBy('startedAt', 'desc'));

    return onSnapshot(qAny, (snap) => {
      const items = snap.docs.map((d) => ({
        progressId: d.id,
        ...(d.data() as any),
        mode: 'personal' as const,
      }));

      console.log(
        '[challengeService.subscribePersonalOngoing] snapshot size =',
        snap.size,
        items,
      );

      onChange(items);
    });
  },

  // 🔵 가족 진행 상황 실시간 구독
  subscribeFamilyOngoing(
    familyId: string,
    onChange: (docs: any[]) => void,
  ): () => void {
    const colRef = collection(db, 'families', familyId, 'challengeProgress');

    const qAny = query(colRef, orderBy('startedAt', 'desc'));

    return onSnapshot(qAny, (snap) => {
      const items = snap.docs.map((d) => ({
        progressId: d.id,
        ...(d.data() as any),
        mode: 'family' as const,
      }));

      console.log(
        '[challengeService.subscribeFamilyOngoing] snapshot size =',
        snap.size,
        items,
      );

      onChange(items);
    });
  },

  /** 🔵 개인 진행중 챌린지 실시간 구독 (status 상관없이 전체) */
  subscribePersonalProgress(params: {
    uid: string;
    onChange: (docs: any[]) => void;
  }) {
    const { uid, onChange } = params;
    const colRef = collection(db, 'users', uid, 'challengeProgress');

    // 🔥 status 필터 없음: ONGOING/COMPLETED/FAILED 전부 다 받아옴
    const qAny = query(colRef);

    const unsub = onSnapshot(qAny, (snap) => {
      const list = snap.docs.map((d) => ({
        progressId: d.id,
        ...(d.data() as any),
        mode: 'personal' as const,
      }));

      console.log(
        '[challengeService.subscribePersonalProgress] snapshot size =',
        snap.size,
        list,
      );

      onChange(list);
    });

    return unsub; // () => void
  },

  /** 🔵 가족 진행중 챌린지 실시간 구독 (status 상관없이 전체) */
  subscribeFamilyProgress(params: {
    familyId: string;
    onChange: (docs: any[]) => void;
  }) {
    const { familyId, onChange } = params;
    const colRef = collection(db, 'families', familyId, 'challengeProgress');

    const qAny = query(colRef); // status 필터 없음

    const unsub = onSnapshot(qAny, (snap) => {
      const list = snap.docs.map((d) => ({
        progressId: d.id,
        ...(d.data() as any),
        mode: 'family' as const,
      }));

      console.log(
        '[challengeService.subscribeFamilyProgress] snapshot size =',
        snap.size,
        list,
      );

      onChange(list);
    });

    return unsub;
  },

  /** 추천 챌린지: /challenges 템플릿에서 읽기 */
  async getRecommended(opts: { cursor?: string | null }) {
    const { cursor } = opts;
    const colRef = collection(db, 'challenges');

    let qAny: any = query(colRef, orderBy('createdAt', 'desc'), limit(20));

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

  /** 도전 시작: 추천 챌린지 템플릿을 기반으로 challengeProgress 문서 생성 */
  async startChallenge(challengeId: string) {
    console.log('🔥 [startChallenge] called with challengeId =', challengeId);
    console.log('🔥 [startChallenge] auth.currentUser =', auth.currentUser);

    const user = auth.currentUser;
    if (!user) throw new Error('로그인 필요');

    // 1) 템플릿 로드
    const tmplRef = doc(db, 'challenges', challengeId);
    const tmplSnap = await getDoc(tmplRef);
    if (!tmplSnap.exists()) throw new Error('챌린지 템플릿 없음');

    const d = tmplSnap.data() as any;

    const mode: 'personal' | 'family' = d.mode ?? 'personal';
    const challengeCategory: string = d.category ?? 'chores';

    const durationType: string = d.durationType ?? 'daily';
    const progressType: string = d.progressType ?? 'single';
    const recommendedTimeSlot: string | undefined = d.recommendedTimeSlot;
    const deviceType: string = d.deviceType ?? 'none';
    const unit: string | undefined = d.unit;

    // single 타입이면 1회 완료 기준, 아니면 템플릿에 별도 targetValue가 있으면 사용
    const targetValue: number =
      typeof d.targetValue === 'number'
        ? d.targetValue
        : progressType === 'single'
          ? 1
          : 0;

    const basePersonalPoints: number = d.basePersonalPoints ?? 0;
    const baseFamilyPoints: number = d.baseFamilyPoints ?? 0;

    // 2) personal vs family에 따라 경로 결정
    let progressDocRef;

    if (mode === 'personal') {
      // /users/{uid}/challengeProgress/{challengeId}
      progressDocRef = doc(
        db,
        'users',
        user.uid,
        'challengeProgress',
        challengeId,
      );
    } else {
      // /families/{familyId}/challengeProgress/{challengeId}
      // familyId는 /users/{uid} 문서에서 가져옴.
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        throw new Error('사용자 문서를 찾을 수 없습니다.');
      }

      const userData = userSnap.data() as any;
      const familyId: string | undefined = userData.familyId;

      if (!familyId) {
        throw new Error('가족 정보가 없어 가족 챌린지를 시작할 수 없습니다.');
      }

      progressDocRef = doc(
        db,
        'families',
        familyId,
        'challengeProgress',
        challengeId,
      );
    }

    // 3) payload 구성 (undefined 필드는 넣지 않기)
    const payload: any = {
      cardId: challengeId,
      challengeId,
      challengeTitle: d.title,
      challengeCategory,
      mode,

      deviceType,
      durationType,
      progressType,

      status: 'ONGOING',
      startedAt: serverTimestamp(),
      lastEventDate: null,

      currentValue: 0,
      targetValue,

      totalEnergyKwh: 0,
      totalPersonalPoints: mode === 'personal' ? basePersonalPoints : 0,
      totalFamilyPoints: mode === 'family' ? baseFamilyPoints : 0,
    };

    // 선택 필드들: 값이 있을 때만 추가
    if (recommendedTimeSlot != null) {
      payload.recommendedTimeSlot = recommendedTimeSlot;
    }
    if (unit != null && unit !== '') {
      payload.unit = unit;
    }

    // 4) 문서 저장
    await setDoc(progressDocRef, payload);

    console.log('[startChallenge] created progress doc', {
      mode,
      challengeId,
      path: progressDocRef.path,
    });
  },

  /** 완료 처리: challengeProgress 문서 상태 업데이트 + 포인트 리턴 */
  // challengeService.ts

  async completeChallenge(challengeId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인 필요');

    // 1) 개인 진행 문서 찾기
    const personalRef = doc(
      db,
      'users',
      user.uid,
      'challengeProgress',
      challengeId,
    );
    const personalSnap = await getDoc(personalRef);

    let targetRef = personalRef;
    let data: any | null = null;
    let mode: 'personal' | 'family' = 'personal';

    if (personalSnap.exists()) {
      data = personalSnap.data();
      mode = (data.mode as 'personal' | 'family') ?? 'personal';
    } else {
      // 2) 없으면 family 진행 문서 찾기
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() as any | undefined;
      const familyId = userData?.familyId as string | undefined;

      if (!familyId) {
        // 진행 문서가 아예 없는 경우
        return {
          rewardPoints: 0,
          category: '나' as Filter,
          title: '',
        };
      }

      const familyRef = doc(
        db,
        'families',
        familyId,
        'challengeProgress',
        challengeId,
      );
      const familySnap = await getDoc(familyRef);

      if (!familySnap.exists()) {
        return {
          rewardPoints: 0,
          category: '나' as Filter,
          title: '',
        };
      }

      targetRef = familyRef;
      data = familySnap.data();
      mode = (data.mode as 'personal' | 'family') ?? 'family';
    }

    // 3) 문서 업데이트: 완료 처리
    await updateDoc(targetRef, {
      status: 'COMPLETED',
      completedAt: serverTimestamp(),
      progressPct: 100,
    });

    // 4) 포인트 / 카테고리 리턴
    const rewardPoints: number =
      (data.totalPersonalPoints as number) ??
      (data.totalFamilyPoints as number) ??
      0;

    const category: Filter = mode === 'personal' ? '나' : '가족';
    const title: string =
      (data.challengeTitle as string) ?? (data.title as string) ?? '';

    return {
      rewardPoints,
      category,
      title,
    };
  },

  /** 나의 챌린지 요약 지표 */
  async getMySummary(uid: string) {
    const colRef = collection(db, 'users', uid, 'challengeProgress');
    const snap = await getDocs(colRef);

    const summary = summarizeChallengeSnap(snap);
    console.log('[challengeService.getMySummary]', summary);

    return summary;
  },

  /** 우리 가족 챌린지 요약 지표 */
  async getFamilySummary(familyId: string) {
    const colRef = collection(db, 'families', familyId, 'challengeProgress');
    const snap = await getDocs(colRef);

    const summary = summarizeChallengeSnap(snap);
    console.log('[challengeService.getFamilySummary]', summary);

    return summary;
  },

  /** 나의 챌린지 요약 지표 실시간 구독 */
  subscribeMySummary(
    uid: string,
    cb: (summary: {
      totalParticipated: number;
      totalCompleted: number;
      successRate: number;
    }) => void,
  ) {
    const colRef = collection(db, 'users', uid, 'challengeProgress');

    const unsubscribe = onSnapshot(colRef, (snap) => {
      const summary = summarizeChallengeSnap(snap);
      console.log('[challengeService.subscribeMySummary]', summary);
      cb(summary);
    });

    return unsubscribe;
  },

  /** 가족 챌린지 요약 지표 실시간 구독 */
  subscribeFamilySummary(
    familyId: string,
    cb: (summary: {
      totalParticipated: number;
      totalCompleted: number;
      successRate: number;
    }) => void,
  ) {
    const colRef = collection(db, 'families', familyId, 'challengeProgress');

    const unsubscribe = onSnapshot(colRef, (snap) => {
      const summary = summarizeChallengeSnap(snap);
      console.log('[challengeService.subscribeFamilySummary]', summary);
      cb(summary);
    });

    return unsubscribe;
  },
};
