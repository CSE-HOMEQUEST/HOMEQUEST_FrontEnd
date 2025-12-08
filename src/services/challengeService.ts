// src/services/challengeService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
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

  // 이번 미션 한 판의 보상값
  rewardPersonalPoints?: number;
  rewardFamilyPoints?: number;

  // 나머지 필드
  deviceType?: string;
  durationType?: string;
  progressType?: string;
  recommendedTimeSlot?: string;
  unit?: string;
  startedAt?: Timestamp;
  lastEventDate?: Timestamp;
};

export type ContributionDoc = {
  id: string;
  challengeId: string;
  challengeTitle?: string;
  challengeCategory?: string;
  deviceType?: string;
  durationType?: string;
  progressType?: string;
  mode?: 'personal' | 'family';

  // contribution 필드들
  actionType?: string;
  completionTime?: string;
  energyKwh?: number;
  eventDate: Timestamp;
  personalPoints?: number;
  timeSlot?: string;
  weekday?: number;
};

export type WeeklyContributionsResult = {
  start: Timestamp; // 기간 시작 (포함)
  end: Timestamp; // 기간 끝 (미포함)
  contributions: ContributionDoc[];
};

// 챌린지 페이지네이션 타입 (AI 추천 / 기본 추천 둘 다 동일 구조)
export type ChallengeDtoPage = {
  items: ChallengeDto[];
  cursor: string | null;
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

// -------------- 시간 관련 유틸 --------------
const formatTimeHHMMSS = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const getTimeSlotFromHour = (hour: number): string => {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

// 월=0, 화=1, ... 일=6 으로 맞추기 (예시 weekday=0 이 월요일이었던 것 맞추기)
const getWeekdayMon0 = (date: Date): number => {
  return (date.getDay() + 6) % 7;
};

// baseDate 기준으로 최근 7일 (어제까지) 범위 계산
function getWeeklyRange(baseDate: Date): { start: Timestamp; end: Timestamp } {
  // baseDate 기준 "오늘 0시"
  const endDate = new Date(baseDate);
  endDate.setHours(0, 0, 0, 0);

  // 최근 7일 → 어제까지 (1일 ~ 7일)
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 7);

  return {
    start: Timestamp.fromDate(startDate),
    end: Timestamp.fromDate(endDate),
  };
}

// baseDate 기준 하루 범위 (해당 날짜 0시 ~ 다음날 0시)
function getDayRange(baseDate: Date): { start: Timestamp; end: Timestamp } {
  const startDate = new Date(baseDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 1);

  return {
    start: Timestamp.fromDate(startDate),
    end: Timestamp.fromDate(endDate),
  };
}

// Timestamp → 'YYYY-MM-DD' (날짜만)
const tsToDateString = (ts: Timestamp): string => {
  const d = ts.toDate();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// -----------------------------

// 최근 1주일 contributions 기준으로 카테고리별 연속 성공일수 계산
function computeCategoryStreaksFromWeekly(
  weekly: WeeklyContributionsResult,
): Record<string, number> {
  const { end, contributions } = weekly;

  // 날짜별 → 카테고리 set
  const dateToCategories = new Map<string, Set<string>>();

  contributions.forEach((c) => {
    const key = tsToDateString(c.eventDate);
    const cat = c.challengeCategory ?? 'unknown';

    if (!dateToCategories.has(key)) {
      dateToCategories.set(key, new Set());
    }
    dateToCategories.get(key)!.add(cat);
  });

  // 전체 카테고리 목록
  const allCategories = new Set<string>();
  dateToCategories.forEach((set) => {
    set.forEach((cat) => allCategories.add(cat));
  });

  const streaks: Record<string, number> = {};
  allCategories.forEach((cat) => (streaks[cat] = 0));

  // end는 baseDate의 0시 → 마지막 포함일은 end - 1일
  const endDate = end.toDate(); // ex) 12/08 00:00
  // 7일치: end-1, end-2, ... end-7
  for (const cat of allCategories) {
    let streak = 0;

    for (let i = 1; i <= 7; i++) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);
      const key = tsToDateString(Timestamp.fromDate(d));

      const cats = dateToCategories.get(key);
      if (cats && cats.has(cat)) {
        streak += 1;
      } else {
        break; // 끊기면 거기서 stop
      }
    }

    streaks[cat] = streak;
  }

  return streaks;
}

// -----------------------------
// AI 추천 RAW 타입 & API URL
// -----------------------------
const AI_API_URL = 'https://callai-jb7eegn52q-du.a.run.app';

type AiBaseChallenge = {
  adj_score: number;
  category: string; // 'health' | 'energy' | 'dishwashing' ...
  challengeId: string; // 🔴 Firestore /challenges/{challengeId} 와 맞춘다고 가정
  deviceType?: string;
  durationType?: string; // 'short' | 'long' ...
  freq?: number;
  mode?: string; // 'daily' | 'monthly' ...
  progressType?: string; // 'counter' | 'energy' ...
  score: number;
  available?: boolean;
  cooldown_days?: number;
};

type AiDailyChallenge = AiBaseChallenge & {
  mode?: 'daily';
};

type AiMonthlyChallenge = AiBaseChallenge & {
  mode?: 'monthly';
};

type AiSpeedChallenge = {
  adj_score: number;
  category: string; // 'dishwashing'
  challengeId: string;
  energyKwh?: number;
  familyPoints?: number;
  freq?: number;
  notif_min?: number; // 분 단위 (예: 1020 = 17 * 60)
  notificationTime?: string; // "17:00:00"
  personalPoints?: number;
  score: number;
  userId: string;
  weekday?: number;
};

export type TodayReportResponse = {
  daily?: AiDailyChallenge;
  monthly?: AiMonthlyChallenge;
  speed?: AiSpeedChallenge;
  energyHigh?: boolean;
  main_auc?: number;
  speed_auc?: number;
  userId: string;
};
// -----------------------------

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
    const difficultyLevel: number | undefined = d.difficultyLevel;

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

      // 이번 미션 한 판의 보상값
      rewardPersonalPoints: basePersonalPoints,
      rewardFamilyPoints: baseFamilyPoints,
    };

    // 선택 필드들: 값이 있을 때만 추가
    if (recommendedTimeSlot != null) {
      payload.recommendedTimeSlot = recommendedTimeSlot;
    }
    if (unit != null && unit !== '') {
      payload.unit = unit;
    }
    if (difficultyLevel != null) {
      payload.difficultyLevel = difficultyLevel;
    }

    // 4) 문서 저장
    await setDoc(progressDocRef, payload);

    console.log('[startChallenge] created progress doc', {
      mode,
      challengeId,
      path: progressDocRef.path,
    });
  },

  /** 완료 처리: challengeProgress + contributions + user/family 포인트 + 리턴 */
  async completeChallenge(challengeId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인 필요');

    // 1) personal progress 문서 있는지 먼저 확인
    const personalProgressRef = doc(
      db,
      'users',
      user.uid,
      'challengeProgress',
      challengeId,
    );
    const personalSnap = await getDoc(personalProgressRef);

    let progressRef = personalProgressRef;
    let mode: 'personal' | 'family' = 'personal';
    let familyId: string | null = null;

    if (!personalSnap.exists()) {
      // 2) 없으면 family progress 문서 탐색
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        throw new Error('사용자 문서를 찾을 수 없습니다.');
      }
      const userData = userSnap.data() as any;
      familyId = userData.familyId ?? null;
      if (!familyId) {
        throw new Error('가족 정보가 없어 가족 챌린지를 완료할 수 없습니다.');
      }

      const familyProgressRef = doc(
        db,
        'families',
        familyId,
        'challengeProgress',
        challengeId,
      );
      const familySnap = await getDoc(familyProgressRef);
      if (!familySnap.exists()) {
        throw new Error('진행 중인 챌린지를 찾을 수 없습니다.');
      }

      progressRef = familyProgressRef;
      mode = 'family';
    } else {
      // personal인 경우에도 familyId는 contributions에 넣을 수 있게 미리 읽어둠 (선택)
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as any;
        familyId = userData.familyId ?? null;
      }
    }

    const now = new Date();
    const completionTime = formatTimeHHMMSS(now);
    const eventDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekday = getWeekdayMon0(eventDate);
    const timeSlot = getTimeSlotFromHour(now.getHours());

    type TxResult = {
      rewardPoints: number;
      isCompleted: boolean;
      mode: 'personal' | 'family';
      title: string;
      currentValue: number;
      targetValue: number;
      unit?: string;
    };

    const result = await runTransaction(db, async (tx): Promise<TxResult> => {
      // 1) progress 문서 먼저 읽기 (반드시 맨 위에서)
      const snap = await tx.get(progressRef);
      if (!snap.exists()) {
        throw new Error('진행 중인 챌린지를 찾을 수 없습니다.');
      }

      const data = snap.data() as any;

      const currentValue: number =
        typeof data.currentValue === 'number' ? data.currentValue : 0;
      const targetValue: number =
        typeof data.targetValue === 'number' ? data.targetValue : 0;
      const status: string = data.status ?? 'ONGOING';

      const challengeCategory: string = data.challengeCategory ?? 'chores';
      const durationType: string = data.durationType ?? 'daily';
      const progressType: string = data.progressType ?? 'single';
      const deviceType: string = data.deviceType ?? 'none';
      const unit: string | undefined = data.unit;

      const rewardPersonalPoints: number =
        data.rewardPersonalPoints ?? data.basePersonalPoints ?? 0;
      const rewardFamilyPoints: number =
        data.rewardFamilyPoints ?? data.baseFamilyPoints ?? 0;

      const title: string = data.challengeTitle ?? data.title ?? '';

      // 이번 기여의 value (지금은 1회 기준)
      let deltaValue = 1;
      if (unit && unit !== '번') {
        // TODO: 물/L, kWh 등 aggregate 모드에서 rawValue 사용
      }

      const newCurrentValue = currentValue + deltaValue;

      const isJustCompleted =
        status !== 'COMPLETED' &&
        targetValue > 0 &&
        newCurrentValue >= targetValue;

      // 2) 포인트 업데이트를 위해 users/families도 "읽기만" 해둔다 (필요한 경우에만)
      let userData: any = null;
      let familyData: any = null;
      let fid: string | null = familyId ?? data.familyId ?? null;

      if (isJustCompleted) {
        if (mode === 'personal') {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await tx.get(userRef); // ✅ still before any write
          userData = (userSnap.data() as any) ?? {};
        } else {
          if (!fid) {
            throw new Error('가족 ID가 없어 포인트를 갱신할 수 없습니다.');
          }
          const familyRef = doc(db, 'families', fid);
          const familySnap = await tx.get(familyRef); // ✅ still before any write
          familyData = (familySnap.data() as any) ?? {};
        }
      }

      // 3) 이제부터는 "쓰기만"

      // 3-1) contributions 서브컬렉션에 이벤트 생성
      const contribColRef = collection(progressRef, 'contributions');
      const contribDocRef = doc(contribColRef); // auto-id

      let personalPoints = 0;
      let familyPoints = 0;

      if (isJustCompleted) {
        if (mode === 'personal') {
          personalPoints = rewardPersonalPoints;
        } else {
          familyPoints = rewardFamilyPoints;
        }
      }

      const contribPayload: any = {
        actionType: deviceType,
        category: challengeCategory,
        challengeId,
        completed: isJustCompleted,
        completionTime,
        createdAt: serverTimestamp(),
        deviceType,
        durationType,
        energyKwh: 0,
        eventDate,
        eventId: contribDocRef.id,
        familyId: fid,
        familyPoints,
        mode,
        notificationTime: null,
        personalPoints,
        progressType,
        timeSlot,
        userId: mode === 'family' ? user.uid : null,
        value: deltaValue,
        weekday,
      };

      Object.keys(contribPayload).forEach((k) => {
        if (contribPayload[k] === null || contribPayload[k] === undefined) {
          delete contribPayload[k];
        }
      });

      tx.set(contribDocRef, contribPayload);

      // 3-2) progress 문서 업데이트
      const update: any = {
        currentValue: newCurrentValue,
        lastEventDate: eventDate,
        totalEnergyKwh: (data.totalEnergyKwh ?? 0) + 0,
      };

      if (isJustCompleted) {
        update.status = 'COMPLETED';
      }

      tx.update(progressRef, update);

      // 3-3) user / family 포인트 업데이트 (이미 읽어둔 데이터 사용, 추가 read 없음)
      let rewardPoints = 0;

      if (isJustCompleted) {
        if (mode === 'personal') {
          const userRef = doc(db, 'users', user.uid);
          const prevTotal = userData?.totalPoints ?? 0;
          const newTotal = prevTotal + rewardPersonalPoints;
          tx.update(userRef, { totalPoints: newTotal });
          rewardPoints = rewardPersonalPoints;
        } else {
          if (!fid) {
            throw new Error('가족 ID가 없어 포인트를 갱신할 수 없습니다.');
          }
          const familyRef = doc(db, 'families', fid);
          const prevTotal = familyData?.totalFamilyPoints ?? 0;
          const newTotal = prevTotal + rewardFamilyPoints;
          tx.update(familyRef, { totalFamilyPoints: newTotal });
          rewardPoints = rewardFamilyPoints;
        }
      }

      return {
        rewardPoints,
        isCompleted: isJustCompleted,
        mode,
        title,
        currentValue: newCurrentValue, // 새 currentValue값 리턴
        targetValue,
        unit,
      };
    });

    return {
      rewardPoints: result.rewardPoints,
      category: (result.mode === 'personal' ? '나' : '가족') as Filter,
      title: result.title,
      isCompleted: result.isCompleted,
      currentValue: result.currentValue,
      targetValue: result.targetValue,
      unit: result.unit,
    };
  },

  /** 나의 챌린지 요약 지표 */
  async getMySummary(uid: string) {
    const colRef = collection(db, 'users', uid, 'challengeProgress');
    const snap = await getDocs(colRef);

    let totalParticipated = 0;
    let totalCompleted = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const status = (data.status as string) ?? 'ONGOING';

      // 참여한 미션: ONGOING / COMPLETED / FAILED / EXPIRED
      if (
        status === 'ONGOING' ||
        status === 'COMPLETED' ||
        status === 'FAILED'
      ) {
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

    console.log('[challengeService.getMySummary]', {
      totalParticipated,
      totalCompleted,
      successRate,
    });

    return { totalParticipated, totalCompleted, successRate };
  },

  /** 우리 가족 챌린지 요약 지표 */
  async getFamilySummary(familyId: string) {
    const colRef = collection(db, 'families', familyId, 'challengeProgress');
    const snap = await getDocs(colRef);

    let totalParticipated = 0;
    let totalCompleted = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const status = (data.status as string) ?? 'ONGOING';

      // 참여한 미션: ONGOING / COMPLETED / FAILED
      if (
        status === 'ONGOING' ||
        status === 'COMPLETED' ||
        status === 'FAILED'
      ) {
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

    console.log('[challengeService.getFamilySummary]', {
      totalParticipated,
      totalCompleted,
      successRate,
    });

    return { totalParticipated, totalCompleted, successRate };
  },

  /** 🔵 AI 기반 개인화 추천: AI RAW + /challenges 템플릿 합치기 */
  async getAiRecommended(params: { uid: string }): Promise<ChallengeDtoPage> {
    const { uid } = params;

    // 1) AI 서버 호출
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: uid,
        top_k: 3,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.log('[AI Challenge ERROR]', res.status, text);
      throw new Error(text || `status ${res.status}`);
    }

    const raw: TodayReportResponse = await res.json();
    console.log('[AI API RAW DATA]', raw);

    // 2) RAW에서 daily / monthly / speed를 평탄화
    const aiList: {
      slot: 'daily' | 'monthly' | 'speed';
      data: AiBaseChallenge | AiSpeedChallenge;
    }[] = [];

    if (raw.daily) aiList.push({ slot: 'daily', data: raw.daily });
    if (raw.monthly) aiList.push({ slot: 'monthly', data: raw.monthly });
    if (raw.speed) aiList.push({ slot: 'speed', data: raw.speed });

    if (aiList.length === 0) {
      return { items: [], cursor: null };
    }

    // 3) 각 AI challengeId 에 해당하는 /challenges 템플릿 문서 읽기
    //    🔴 여기서 challengeId === Firestore 문서 id 라고 가정
    //    만약 다르면 중간에 매핑 함수 한 번 거쳐야 함.
    const snaps = await Promise.all(
      aiList.map((it) => getDoc(doc(db, 'challenges', it.data.challengeId))),
    );

    const items: ChallengeDto[] = [];

    snaps.forEach((snap, idx) => {
      const ai = aiList[idx];
      if (!snap.exists()) {
        console.log(
          '[getAiRecommended] template NOT FOUND for challengeId =',
          ai.data.challengeId,
        );
        return;
      }

      const base = mapDocToDto(
        snap as QueryDocumentSnapshot<unknown, DocumentData>,
      );

      const slot = ai.slot;
      const data = ai.data;

      // speed 타입일 때만 personalPoints / familyPoints 가 들어있음
      const speed = slot === 'speed' ? (data as AiSpeedChallenge) : undefined;

      // 🔵 추천 결과 = 템플릿 + AI 메타 덮어쓰기
      items.push({
        ...base,

        // 포인트: speed에 personalPoints/familyPoints가 있으면 그걸 우선 사용
        basePersonalPoints:
          speed?.personalPoints ?? base.basePersonalPoints ?? 0,
        baseFamilyPoints: speed?.familyPoints ?? base.baseFamilyPoints ?? 0,

        // 추천 시간: speed.notificationTime 이 있으면 그걸 사용, 없으면 템플릿 값 유지
        recommendedTimeSlot:
          speed?.notificationTime ?? base.recommendedTimeSlot,
      });
    });

    return { items, cursor: null };
  },

  // LLM AI에 넘길 3가지 - contribution, todaySuccessCount, categoryStreak
  /**
   * 기준 날짜(baseDate) 기준, "최근 1주일(어제까지)" 동안
   * 현재 유저가 수행한 contributions를 가져온다.
   *
   * 1단계: challengeProgress 중 lastEventDate가 범위에 겹치는 챌린지들만 조회
   * 2단계: 그 챌린지의 contributions 서브컬렉션에서 eventDate로 다시 필터링
   */
  async getWeeklyContributionsForCurrentUser(
    baseDate: Date = new Date(),
  ): Promise<WeeklyContributionsResult> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('[getWeeklyContributionsForCurrentUser] no current user');
    }

    const { start, end } = getWeeklyRange(baseDate);

    // 1) challengeProgress 중 lastEventDate가 주간에 겹치는 챌린지들만 조회
    const progressColRef = collection(
      db,
      'users',
      user.uid,
      'challengeProgress',
    );
    const progressQuery = query(
      progressColRef,
      where('lastEventDate', '>=', start),
      where('lastEventDate', '<', end),
    );

    const progressSnap = await getDocs(progressQuery);

    if (progressSnap.empty) {
      return { start, end, contributions: [] };
    }

    const tasks: Promise<ContributionDoc[]>[] = [];

    progressSnap.forEach((progressDocSnap) => {
      const progressData = progressDocSnap.data() as ChallengeProgressDoc;
      const challengeId = progressData.challengeId ?? progressDocSnap.id;

      const contribColRef = collection(progressDocSnap.ref, 'contributions');
      const contribQuery = query(
        contribColRef,
        where('eventDate', '>=', start),
        where('eventDate', '<', end),
      );

      const task = getDocs(contribQuery).then((contribSnap) => {
        if (contribSnap.empty) return [];

        return contribSnap.docs.map((contribDoc) => {
          const c = contribDoc.data() as DocumentData;

          const contribution: ContributionDoc = {
            id: contribDoc.id,
            challengeId,
            challengeTitle: progressData.challengeTitle,
            challengeCategory: progressData.challengeCategory,
            deviceType: progressData.deviceType,
            durationType: progressData.durationType,
            progressType: progressData.progressType,
            mode: progressData.mode,

            // 원본 contribution 필드들
            actionType: c.actionType,
            completionTime: c.completionTime,
            energyKwh: c.energyKwh,
            eventDate: c.eventDate,
            personalPoints: c.personalPoints,
            timeSlot: c.timeSlot,
            weekday: c.weekday,
          };

          return contribution;
        });
      });

      tasks.push(task);
    });

    const results = await Promise.all(tasks);
    const contributions = results.flat();

    return { start, end, contributions };
  },

  /**
   * 기준 날짜(baseDate) 기준 "오늘" 하루 동안
   * 현재 유저가 완료한 contribution 개수를 반환한다.
   *
   * - progress에서 lastEventDate가 오늘에 겹치는 챌린지만 먼저 찾고
   * - 그 챌린지의 contributions에서 eventDate 기준으로 다시 필터링
   */
  async getTodaySuccessCountForCurrentUser(
    baseDate: Date = new Date(),
  ): Promise<{ date: Timestamp; successCount: number }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('[getTodaySuccessCountForCurrentUser] no current user');
    }

    const { start, end } = getDayRange(baseDate);

    // 1) 오늘 안에 이벤트가 있는 progress만 조회
    const progressColRef = collection(
      db,
      'users',
      user.uid,
      'challengeProgress',
    );
    const progressQuery = query(
      progressColRef,
      where('lastEventDate', '>=', start),
      where('lastEventDate', '<', end),
    );

    const progressSnap = await getDocs(progressQuery);
    if (progressSnap.empty) {
      return { date: start, successCount: 0 };
    }

    let total = 0;
    const tasks: Promise<void>[] = [];

    progressSnap.forEach((progressDocSnap) => {
      const contribColRef = collection(progressDocSnap.ref, 'contributions');
      const contribQuery = query(
        contribColRef,
        where('eventDate', '>=', start),
        where('eventDate', '<', end),
      );

      const task = getDocs(contribQuery).then((contribSnap) => {
        contribSnap.forEach((docSnap) => {
          const c = docSnap.data() as DocumentData;
          const completed: boolean = c.completed ?? true; // seed 데이터는 대부분 true라 가정
          if (completed) {
            total += 1;
          }
        });
      });

      tasks.push(task);
    });

    await Promise.all(tasks);

    return {
      date: start, // 해당 "오늘"의 0시
      successCount: total,
    };
  },

  /**
   * 기준 날짜(baseDate) 기준, "최근 1주일(어제까지)" contributions를 기반으로
   * 카테고리별 연속 며칠 성공했는지 계산.
   *
   * - "성공"의 기준: 해당 날짜에 해당 카테고리 contribution이 1개 이상 존재
   * - streak은 baseDate의 전날부터 거꾸로 올라가며 끊길 때까지 센다.
   */
  async getWeeklyCategoryStreaksForCurrentUser(
    baseDate: Date = new Date(),
  ): Promise<{
    start: Timestamp;
    end: Timestamp;
    streaks: Record<string, number>;
  }> {
    const weekly = await this.getWeeklyContributionsForCurrentUser(baseDate);

    const streaks = computeCategoryStreaksFromWeekly(weekly);

    return {
      start: weekly.start,
      end: weekly.end,
      streaks,
    };
  },

  async getWeeklyAiReportData(baseDate: Date = new Date()) {
    const [weekly, today, streaks] = await Promise.all([
      this.getWeeklyContributionsForCurrentUser(baseDate),
      this.getTodaySuccessCountForCurrentUser(baseDate),
      this.getWeeklyCategoryStreaksForCurrentUser(baseDate),
    ]);

    // 1) weekly.contributions 에서 Timestamp/노이즈 정리
    const plainWeeklyContributions = weekly.contributions.map((c) => {
      const { eventDate, ...rest } = c;

      return {
        ...rest,
        // Timestamp → 사람이 읽을 수 있는 문자열로 변환
        eventDate: tsToDateString(eventDate),
      };
    });

    // 2) 기간(start/end)도 Timestamp → 문자열로 변환
    return {
      period: {
        start: tsToDateString(weekly.start),
        end: tsToDateString(weekly.end),
      },
      today_success_count: today.successCount,
      category_streaks: streaks.streaks,
      weekly_contributions: plainWeeklyContributions,
    };
  },
};
