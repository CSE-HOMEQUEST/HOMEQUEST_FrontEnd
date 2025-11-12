// src/store/useAuthStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type User = { email: string };
type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean; // 로그인 진행 표시 등
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrateDone: boolean; // 스토리지 로드 완료 여부
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      hydrateDone: false,
      login: async (email, _password) => {
        set({ isLoading: true });
        // 실제 API 연동 대신 데모 로직. 여기서 서버 호출로 교체하면 됨.
        await new Promise((r) => setTimeout(r, 400));
        // 예시 검증
        const fakeToken = 'demo-token-123';
        set({ user: { email }, token: fakeToken, isLoading: false });
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 저장할 키를 필요한 것만 부분 저장 (로딩 플래그는 저장 X)
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        // 스토리지 로드 완료 표시
        state?.hydrateDone === false && state && (state.hydrateDone = true);
      },
    },
  ),
);
