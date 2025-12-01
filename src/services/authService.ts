// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '../firebase/firebase'; // ✅ 여기 경로는 프로젝트에 맞게

/**
 * 회원가입: Firebase Auth + Firestore /users/{uid}
 * 닉네임은 온보딩에서 따로 받으므로 여기서는 계정 정보만 저장
 */
export async function apiSignUp(params: {
  email: string;
  password: string;
  phone?: string;
}) {
  const { email, password, phone } = params;

  console.log('[apiSignUp] start', params);

  // 1) Auth에 계정 생성
  const cred: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const uid = cred.user.uid;
  console.log('[apiSignUp] created user', uid);

  // 2) Firestore /users/{uid} 문서 생성
  await setDoc(doc(db, 'users', uid), {
    nickName: '', // 온보딩에서 채울 예정
    email,
    avatarUrl: '',
    familyId: null,
    roleInFamily: null,
    orderInChild: null,
    totalPoints: 0,
    phone: phone ?? null,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });

  console.log('[apiSignUp] setDoc done for', uid);

  return { uid };
}

/**
 * 로그인: Firebase Auth → Firestore user 프로필 조회
 */
export async function apiLogin(email: string, password: string) {
  console.log('[apiLogin] start', email);

  // 1) Auth 로그인
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // 2) Firestore에서 /users/{uid} 읽기
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) {
    throw new Error('User profile not found in Firestore');
  }
  const profile = snap.data();

  // 3) 마지막 로그인 시간 업데이트
  await setDoc(
    doc(db, 'users', uid),
    { lastLoginAt: serverTimestamp() },
    { merge: true },
  );

  console.log('[apiLogin] success', uid, profile);

  return { uid, profile };
}

/**
 * 온보딩에서 프로필(닉네임, 역할, 거주지) 업데이트
 */
export async function apiUpdateProfile(
  uid: string,
  data: {
    nickName?: string;
    roleInFamily?: string;
    location?: string;
  },
) {
  console.log('[apiUpdateProfile] uid =', uid, 'data =', data);

  await setDoc(
    doc(db, 'users', uid),
    {
      ...data,
    },
    { merge: true },
  );
}
