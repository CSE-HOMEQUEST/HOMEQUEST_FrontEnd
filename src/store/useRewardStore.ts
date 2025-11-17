// src/store/useRewardStore.ts
import { create } from 'zustand';

/* -------------------------------
   Types
--------------------------------*/
export type HistoryItem = {
  id: number;
  date: string;
  label: string;
  point: number; // + ���� / - ���
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

  // ? ���� Ÿ�Ӷ���
  myHistory: HistoryItem[];

  // ? ���� Ÿ�Ӷ���
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

  // ���� History -> ���� �����丮�� ���
  setHistory: (type: 'my' | 'family', list: HistoryItem[]) => void;

  // ? Ÿ�Ӷ��ο� �� ��� �߰�
  addMyHistory: (item: HistoryItem) => void;
  addFamilyHistory: (item: HistoryItem) => void;

  // ����Ʈ ��� / ����
  spendFamilyPoint: (amount: number) => void;
  addMyPoint: (amount: number) => void;
  spendPoint: (amount: number) => void;
  setLoading: (value: boolean) => void;
};

/* -------------------------------
   Store
--------------------------------*/
export const useRewardStore = create<RewardState>((set) => ({
  // �⺻�� -------------------------------------
  myPoint: 0,
  expectedPoint: 0,

  familyTotal: 0,
  weeklyRank: [],
  monthlyRank: [],
  memberTotal: [],

  // ? �и��� Ÿ�Ӷ���
  myHistory: [],
  familyHistory: [],

  loading: false,

  // ? ���� ������ ������ ����
  setMemberTotal: (data: any) => set({ memberTotal: data }),
  setMyReward: (data) =>
    set({
      myPoint: data.currentPoint,
      expectedPoint: data.expectedPoint,
    }),

  // ? ���� ������ ������ ����
  setFamilyReward: (data) =>
    set({
      familyTotal: data.total,
      weeklyRank: data.weeklyRank,
      monthlyRank: data.monthlyRank, // �� ���� �߰�
    }),

  // ? ���� setHistory() �� ���ο� Ÿ�Ӷ������� ����
  setHistory: (type, list) =>
    set((_state) =>
      type === 'my' ? { myHistory: list } : { familyHistory: list },
    ),

  // ? ���� �����丮 �߰�
  addMyHistory: (item) =>
    set((state) => ({
      myHistory: [...state.myHistory, item],
    })),

  // ? ���� �����丮 �߰�
  addFamilyHistory: (item) =>
    set((state) => ({
      familyHistory: [...state.familyHistory, item],
    })),

  // ? ���� ����Ʈ ���
  spendFamilyPoint: (amount) =>
    set((state) => ({
      familyTotal: state.familyTotal - amount,
    })),

  // ? ���� ����Ʈ ����
  addMyPoint: (amount) =>
    set((state) => ({
      myPoint: state.myPoint + amount,
    })),

  // ? ���� ����Ʈ ���
  spendPoint: (amount) =>
    set((state) => ({
      myPoint: state.myPoint - amount,
    })),

  setLoading: (value) => set({ loading: value }),
}));
