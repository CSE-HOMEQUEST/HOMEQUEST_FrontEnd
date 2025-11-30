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
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { auth, db } from '@/src/firebase/firebase';
import type { Filter } from '@/src/store/useChallengeStore';

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

  /** 도전 시작 */
  async startChallenge(challengeId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인 필요');

    const tmplRef = doc(db, 'challenges', challengeId);
    const tmplSnap = await getDoc(tmplRef);
    if (!tmplSnap.exists()) throw new Error('챌린지 템플릿 없음');

    const d = tmplSnap.data() as any;
    const isPersonal = d.mode === 'personal';

    const userCol = collection(db, 'users', user.uid, 'challenges');
    await addDoc(userCol, {
      challengeId,
      title: d.title,
      category: isPersonal ? '나' : '가족',
      rewardPoints: isPersonal
        ? (d.basePersonalPoints ?? 0)
        : (d.baseFamilyPoints ?? 0),

      status: 'ONGOING',

      progressPct: 0,
      startedAt: serverTimestamp(),
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
