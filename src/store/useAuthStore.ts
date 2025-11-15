// src/store/useAuthStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type User = {
  email: string;
  userId?: string;
  phone?: string;
  firstLogin?: boolean;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hydrateDone: boolean;
  justSignedUp: boolean; // 회원가입 직후 1회용 플래그

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signUp: (p: {
    userId: string;
    password: string;
    email: string;
    phone: string;
  }) => Promise<void>;

  // ✅ 온보딩 완료용 액션 추가
  finishOnboarding: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      hydrateDone: false,
      justSignedUp: false,

      // 로그인
      login: async (email, _password) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 400));

        // 방금 회원가입한 상태라면 첫 로그인으로 취급
        const expectFirst = get().justSignedUp;

        set({
          user: { email, firstLogin: expectFirst },
          token: 'demo-token-123',
          isLoading: false,
          justSignedUp: false, // 플래그 소모
        });
        console.log('[store:login set]', { email, expectFirst });
      },

      // 회원가입
      signUp: async ({
        userId: _userId,
        password: _password,
        email: _email,
        phone: _phone,
      }) => {
        set({ isLoading: true });
        try {
          // TODO: 실제 API 호출
          await new Promise((r) => setTimeout(r, 400));
          // 회원가입 성공 → 다음 로그인은 첫 로그인으로
          set({ justSignedUp: true });
          console.log('[store:signUp] justSignedUp -> true');
        } finally {
          set({ isLoading: false });
        }
      },

      // ✅ 온보딩 완료 처리
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
        set({ user: null, token: null, justSignedUp: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        justSignedUp: s.justSignedUp,
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
