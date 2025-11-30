// src/store/useAuthStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  apiLogin,
  apiSignUp,
  apiUpdateProfile,
} from '@/src/services/authService';

type User = {
  email: string;
  userId?: string; // uid
  phone?: string;
  nickName?: string; // !! 온보딩 프로필에서 채워질 닉네임
  familyRole?: string; // !! 온보딩 프로필
  location?: string; // !! 온보딩 프로필
  firstLogin?: boolean; // true = 첫 로그인 → 온보딩 필요
  familyId?: string; // 가족 ID
  familyName?: string; // 가족 이름
};

type AuthState = {
  user: User | null;
  token: string | null; // 여기서는 uid를 넣어서 사용
  isLoading: boolean;
  hydrateDone: boolean;

  // 최근 회원가입한 이메일 (그 이메일로 첫 로그인하면 온보딩)
  lastSignedUpId: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signUp: (p: {
    email: string;
    password: string;
    phone: string;
  }) => Promise<void>;

  // 온보딩에서 프로필 저장 (닉네임/역할/거주지)
  saveOnboardingProfile: (p: {
    nickName: string;
    familyRole: string;
    location: string;
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
      lastSignedUpId: null,

      // 로그인
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { uid, profile } = await apiLogin(email, password);
          const { lastSignedUpId } = get();
          const isFirstLogin = lastSignedUpId === email;

          set({
            user: {
              email: profile.email ?? email,
              userId: uid,
              phone: profile.phone ?? undefined,
              nickName: profile.nickName ?? undefined,
              familyRole: profile.roleInFamily ?? undefined,
              location: profile.location ?? undefined,
              firstLogin: isFirstLogin,

              familyId: profile.familyId ?? undefined,
              familyName: profile.familyName ?? undefined,
            },
            token: uid,
            isLoading: false,
            lastSignedUpId: isFirstLogin ? null : lastSignedUpId,
          });

          console.log('[store:login set]', {
            email,
            uid,
            isFirstLogin,
            familyId: profile.familyId,
            familyName: profile.familyName,
          });
        } catch (e) {
          set({ isLoading: false });
          console.log('[store:login error]', e);
          throw e;
        }
      },

      // 회원가입 (이메일/비번/폰만)
      signUp: async ({ email, password, phone }) => {
        set({ isLoading: true });
        try {
          await apiSignUp({
            email,
            password,
            phone,
          });

          set({
            lastSignedUpId: email,
          });

          console.log('[store:signUp] saved lastSignedUpId =', email);
        } finally {
          set({ isLoading: false });
        }
      },

      // 온보딩 프로필 저장 (닉네임/역할/거주지)
      saveOnboardingProfile: async ({ nickName, familyRole, location }) => {
        const state = get();
        const uid = state.token;
        const curUser = state.user;
        if (!uid || !curUser) {
          console.warn('[saveOnboardingProfile] no user/uid');
          return;
        }

        await apiUpdateProfile(uid, {
          nickName,
          roleInFamily: familyRole,
          location,
        });

        set({
          user: {
            ...curUser,
            nickName,
            familyRole,
            location,
          },
        });

        console.log('[store:saveOnboardingProfile]', {
          uid,
          nickName,
          familyRole,
          location,
        });
      },

      // 온보딩 완료 (OnboardingFamily에서 호출)
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
