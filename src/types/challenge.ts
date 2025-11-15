// src/types/challenge.ts
export type Challenge = {
  id: string;
  title: string;
  category: '절약' | '가사' | '헬스';
  status: 'ongoing' | 'recommended' | 'completed' | 'failed';
  progressPct?: number;
  rewardPoints?: number;
  duration?: number; // sec
};

export type Page<T> = { items: T[]; cursor?: string | null };
