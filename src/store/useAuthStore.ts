// src/store/useAuthStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type User = {
  email: string; // 여기에는 지금 "아이디"를 넣어서 쓰고 있어도 됨
  userId?: string;
  phone?: string;
  firstLogin?: boolean; // true = 첫 로그인 → 온보딩 필요
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hydrateDone: boolean;

  // 최근 회원가입한 아이디 (그 아이디로 첫 로그인하면 온보딩으로)
  lastSignedUpId: string | null;

  login: (id: string, password: string) => Promise<void>;
  logout: () => void;
  signUp: (p: {
    userId: string;
    password: string;
    email: string;
    phone: string;
  }) => Promise<void>;

  finishOnboarding: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      hydrateDone: false,

      // 새로 추가한 필드 초기값
      lastSignedUpId: null,

      // 로그인
      login: async (id, _password) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 400));

        const { lastSignedUpId } = get();
        const isFirstLogin = lastSignedUpId === id;

        set({
          // email 자리에 아이디(id)를 그냥 넣어서 사용 중
          user: { email: id, firstLogin: isFirstLogin },
          token: 'demo-token-123',
          isLoading: false,
          lastSignedUpId: isFirstLogin ? null : lastSignedUpId,
        });

        console.log('[store:login set]', { id, isFirstLogin });
      },

      // 회원가입
      signUp: async ({
        userId,
        password: _password,
        email: _email,
        phone: _phone,
      }) => {
        set({ isLoading: true });
        try {
          // TODO: 실제 회원가입 API 호출
          await new Promise((r) => setTimeout(r, 400));

          // 최근 회원가입 아이디 저장
          set({
            lastSignedUpId: userId,
          });

          console.log('[store:signUp] lastSignedUpId =', userId);
        } finally {
          set({ isLoading: false });
        }
      },

      // 온보딩 완료
      finishOnboarding: () => {
        const cur = get().user;
        if (!cur) return;
        const next: User = { ...cur, firstLogin: false };
        set({ user: next });
        console.log('[store:finishOnboarding] firstLogin -> false');
      },

      // 로그아웃
      logout: () => {
        console.log('[store:logout]');
        set({
          user: null,
          token: null,
          lastSignedUpId: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 어떤 값들을 AsyncStorage에 저장할지 선택
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        lastSignedUpId: s.lastSignedUpId,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state) {
            state.hydrateDone = true;
            console.log('[store] hydrateDone = true');
          }
          if (error) {
            console.log('[store] rehydrate error', error);
          }
        };
      },
    },
  ),
);
