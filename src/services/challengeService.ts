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

export type ChallengeDto = {
  id: string;
  title: string;
  mode: 'personal' | 'family';
  category: string; // 'chores' | 'health' | ...
  basePersonalPoints?: number;
  baseFamilyPoints?: number;
  createdAt?: string;
};

const mapDocToDto = (
  snap: QueryDocumentSnapshot<unknown, DocumentData>,
): ChallengeDto => {
  const d = snap.data() as DocumentData; // or as any

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

export const challengeService = {
  /** 진행중인 챌린지: /users/{uid}/challenges 에서 읽기 */
  async getOngoing() {
    const user = auth.currentUser;
    if (!user) return [];

    const colRef = collection(db, 'users', user.uid, 'challenges');
    const q = query(colRef, where('status', '==', 'ongoing'));
    const snap = await getDocs(q);

    return snap.docs.map((d) => d.data());
    // 여기서는 raw 데이터로 내보내고, store에서 앱 타입으로 변환해도 됨
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
  async startChallenge(challengeId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인 필요');

    const tmplRef = doc(db, 'challenges', challengeId);
    const tmplSnap = await getDoc(tmplRef);
    if (!tmplSnap.exists()) throw new Error('챌린지 템플릿 없음');

    const d = tmplSnap.data();
    const isPersonal = d.mode === 'personal';

    const userCol = collection(db, 'users', user.uid, 'challenges');
    await addDoc(userCol, {
      challengeId,
      title: d.title,
      category: isPersonal ? '나' : '가족',
      rewardPoints: isPersonal
        ? (d.basePersonalPoints ?? 0)
        : (d.baseFamilyPoints ?? 0),
      status: 'ongoing',
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
      where('status', '==', 'ongoing'),
    );
    const snap = await getDocs(q);
    if (snap.empty)
      return {
        rewardPoints: 0,
        category: '나',
        title: '', // title 항상 string
      };

    const docSnap = snap.docs[0];
    const data = docSnap.data();

    await updateDoc(docSnap.ref, {
      status: 'completed',
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
