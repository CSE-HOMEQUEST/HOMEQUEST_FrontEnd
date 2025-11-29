// src/services/rankingService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';

// families DTO
export type FamilyDto = {
  id: string;
  familyName: string;
  totalFamilyPoints: number;
  rank: number;
};

// 서비스 타입
export type RankingService = {
  // 가족 totalPoints 가져오기 (1회 조회)
  getFamilyTotalPoints(familyId: string): Promise<number>;

  // 가족 전체 totalPoints 가져오기
  getAllFamilyTotalPoints(): Promise<
    { familyId: string; totalFamilyPoints: number; familyName: string }[]
  >;

  // 유저가 속한 가족의 랭킹 가져오기 (1회 조회)
  getUserRank(userId: string): Promise<number>;

  // families 랭킹 실시간 subscribe
  subscribeFamiliesRanking(
    onChange: (families: FamilyDto[]) => void,
  ): () => void;
};

export const rankingService: RankingService = {
  /* ---------------------------------------
   * 1. 특정 가족의 totalFamilyPoints 가져오기
   * ------------------------------------- */
  async getFamilyTotalPoints(familyId: string): Promise<number> {
    console.log('[getFamilyTotalPoints] start, familyId =', familyId);

    const familyRef = doc(db, 'families', familyId);
    const snap = await getDoc(familyRef);

    if (!snap.exists()) {
      console.warn(
        '[getFamilyTotalPoints] family not found, familyId =',
        familyId,
      );
      return 0;
    }

    const data = snap.data() as any;
    const points = data.totalFamilyPoints ?? 0;

    console.log(
      '[getFamilyTotalPoints] success',
      'familyId =',
      familyId,
      'totalFamilyPoints =',
      points,
    );

    return points;
  },

  /* ---------------------------------------
   * 2. 전체 가족의 totalFamilyPoints 가져오기 (점수 높은 순대로 orderBy)
   * ------------------------------------- */

  async getAllFamilyTotalPoints() {
    const familiesRef = collection(db, 'families');
    const q = query(familiesRef, orderBy('totalFamilyPoints', 'desc'));

    const snap = await getDocs(q);

    const list = snap.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        familyId: docSnap.id,
        totalFamilyPoints: data.totalFamilyPoints ?? 0,
        familyName: data.familyName ?? 'Unknown',
      };
    });

    console.log('[getAllFamilyTotalPoints] result:', list);
    return list;
  },

  /* ---------------------------------------
   * 3. 유저가 속한 가족의 랭킹 계산
   *    - /users/{userId} 문서에 familyId 필드가 있음
   * ------------------------------------- */
  async getUserRank(userId: string): Promise<number> {
    console.log('[getUserRank] start, userId =', userId);

    // 1) 유저 문서에서 familyId 먼저 찾기
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn('[getUserRank] user not found, userId =', userId);
      return -1;
    }

    const userData = userSnap.data() as any;
    const familyId: string | undefined = userData.familyId;

    console.log('[getUserRank] user familyId =', familyId);

    if (!familyId) {
      console.warn('[getUserRank] user has no familyId, userId =', userId);
      return -1;
    }

    // 2) families 전체를 totalFamilyPoints 기준으로 내림차순 정렬해서 가져오기
    const familiesRef = collection(db, 'families');
    const q = query(familiesRef, orderBy('totalFamilyPoints', 'desc'));
    const querySnap = await getDocs(q);

    let rank = -1;
    let index = 0;

    console.log('[getUserRank] ----- families ranking snapshot -----');
    querySnap.forEach((docSnap) => {
      index += 1;
      const data = docSnap.data() as any;
      const famId = docSnap.id;
      const points = data.totalFamilyPoints ?? 0;

      console.log(
        `[getUserRank] #${index} familyId=${famId}, points=${points}`,
      );

      if (famId === familyId) {
        rank = index;
      }
    });
    console.log('[getUserRank] -----------------------------------');

    console.log(
      '[getUserRank] final rank for userId =',
      userId,
      ' / familyId =',
      familyId,
      ' => rank =',
      rank,
    );

    return rank;
  },

  /* ---------------------------------------
   * 4. families 랭킹 실시간 구독
   *    - onSnapshot 사용
   *    - UI에서 setFamilyReward 같은 곳에 연결하면 됨
   * ------------------------------------- */
  subscribeFamiliesRanking(onChange) {
    console.log('[subscribeFamiliesRanking] start listening...');

    const familiesRef = collection(db, 'families');
    const q = query(familiesRef, orderBy('totalFamilyPoints', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: FamilyDto[] = snapshot.docs.map((docSnap, index) => {
          const data = docSnap.data() as any;
          const dto: FamilyDto = {
            id: docSnap.id,
            familyName: data.familyName ?? '(이름 없음)',
            totalFamilyPoints: data.totalFamilyPoints ?? 0,
            rank: index + 1,
          };
          return dto;
        });

        console.log(
          '[subscribeFamiliesRanking] ranking updated:',
          list.map((f) => ({
            rank: f.rank,
            id: f.id,
            name: f.familyName,
            point: f.totalFamilyPoints,
          })),
        );

        onChange(list);
      },
      (error) => {
        console.error('[subscribeFamiliesRanking] error:', error);
      },
    );

    return unsubscribe;
  },
};
