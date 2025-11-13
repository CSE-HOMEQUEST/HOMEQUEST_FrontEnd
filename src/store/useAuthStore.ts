// src/store/useAuthStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type User = {
  email: string;
  firstLogin?: boolean; // ✅ 첫 로그인 여부 추가
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hydrateDone: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signUp: (email: string, password: string) => Promise<void>; // ✅ 회원가입 함수 추가
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      hydrateDone: false,

      // ✅ 로그인
      login: async (email, _password) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 400));

        // 실제 서버에선 여기서 "firstLogin" 여부를 응답으로 받는다고 가정
        const fakeToken = 'demo-token-123';
        const isFirstLogin = email.endsWith('new@user.com'); // 예시: 이메일이 특정 패턴이면 첫 로그인 처리

        set({
          user: { email, firstLogin: isFirstLogin },
          token: fakeToken,
          isLoading: false,
        });
      },

      // ✅ 회원가입
      signUp: async (_email, _password) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 400));

        // 회원가입 후 서버에 계정 생성 → 로그인 페이지로 이동하도록 처리
        set({ isLoading: false });
      },

      // ✅ 로그아웃
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        state && (state.hydrateDone = true);
      },
    },
  ),
);
