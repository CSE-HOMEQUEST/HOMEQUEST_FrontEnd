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

        // 회원가입 직후면 첫 로그인으로 처리
        const isFirstLogin = !!get().justSignedUp;

        set({
          user: { email, firstLogin: isFirstLogin },
          token: 'demo-token-123',
          isLoading: false,
          justSignedUp: false, // 플래그 소모
        });
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
          // 성공 시: 첫 로그인 유도 플래그 세팅
          set({ justSignedUp: true });
        } finally {
          set({ isLoading: false });
        }
      },

      // 로그아웃
      logout: () => set({ user: null, token: null, justSignedUp: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 저장 대상(로드 플래그 제외)
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        justSignedUp: s.justSignedUp,
      }),
      // 스토리지 복원 완료 표식
      onRehydrateStorage: () => (state) => {
        // set을 캡처해왔으므로 안전하게 상태로 반영
        // eslint 경고 피하려면 직접 set을 호출하는 방식이 좋습니다.
        if (state !== undefined) {
        }
      },
    },
  ),
);
