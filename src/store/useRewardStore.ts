// src/store/useRewardStore.ts
import { create } from 'zustand';

/* -------------------------------
   Types
--------------------------------*/
export type HistoryItem = {
  id: number;
  date: string;
  label: string;
  point: number; // + 적립 / - 사용
  type: 'earn' | 'use';
};

export type WeeklyRankItem = {
  rank: number;
  name: string;
  point: number;
};

type RewardState = {
  // My Reward
  myPoint: number;
  expectedPoint: number;

  // Family Reward
  familyTotal: number;
  weeklyRank: WeeklyRankItem[];
  monthlyRank: WeeklyRankItem[];
  memberTotal: { name: string; point: number }[];

  // ? 개인 타임라인
  myHistory: HistoryItem[];

  // ? 가족 타임라인
  familyHistory: HistoryItem[];

  // Loading
  loading: boolean;

  /* Actions */
  setMemberTotal: (data: { name: string; point: number }[]) => void;
  setMyReward: (data: { currentPoint: number; expectedPoint: number }) => void;
  setFamilyReward: (data: {
    total: number;
    weeklyRank: WeeklyRankItem[];
    monthlyRank: WeeklyRankItem[];
  }) => void;

  // 기존 History -> 개인 히스토리로 사용
  setHistory: (type: 'my' | 'family', list: HistoryItem[]) => void;

  // ? 타임라인에 새 기록 추가
  addMyHistory: (item: HistoryItem) => void;
  addFamilyHistory: (item: HistoryItem) => void;

  // 포인트 사용 / 적립
  spendFamilyPoint: (amount: number) => void;
  addMyPoint: (amount: number) => void;
  spendPoint: (amount: number) => void;
  setLoading: (value: boolean) => void;
};

/* -------------------------------
   Store
--------------------------------*/
export const useRewardStore = create<RewardState>((set) => ({
  // 기본값 -------------------------------------
  myPoint: 0,
  expectedPoint: 0,

  familyTotal: 0,
  weeklyRank: [],
  monthlyRank: [],
  memberTotal: [],

  // ? 분리된 타임라인
  myHistory: [],
  familyHistory: [],

  loading: false,

  // ? 나의 리워드 데이터 설정
  setMemberTotal: (data: any) => set({ memberTotal: data }),
  setMyReward: (data) =>
    set({
      myPoint: data.currentPoint,
      expectedPoint: data.expectedPoint,
    }),

  // ? 가족 리워드 데이터 설정
  setFamilyReward: (data) =>
    set({
      familyTotal: data.total,
      weeklyRank: data.weeklyRank,
      monthlyRank: data.monthlyRank, // ← 여기 추가
    }),

  // ? 기존 setHistory() → 개인용 타임라인으로 저장
  setHistory: (type, list) =>
    set((_state) =>
      type === 'my' ? { myHistory: list } : { familyHistory: list },
    ),

  // ? 개인 히스토리 추가
  addMyHistory: (item) =>
    set((_state) => ({
      myHistory: [..._state.myHistory, item],
    })),

  // ? 가족 히스토리 추가
  addFamilyHistory: (item) =>
    set((_state) => ({
      familyHistory: [..._state.familyHistory, item],
    })),

  // ? 가족 포인트 사용
  spendFamilyPoint: (amount) =>
    set((_state) => ({
      familyTotal: _state.familyTotal - amount,
    })),

  // ? 개인 포인트 적립
  addMyPoint: (amount) =>
    set((state) => ({
      myPoint: state.myPoint + amount,
    })),

  // ? 개인 포인트 사용
  spendPoint: (amount) =>
    set((_state) => ({
      myPoint: _state.myPoint - amount,
    })),

  setLoading: (value) => set({ loading: value }),
}));
