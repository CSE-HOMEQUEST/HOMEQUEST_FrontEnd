import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '../firebase/firebase';

/**
 * 회원가입: Firebase Auth + Firestore /users/{uid}
 */
export async function apiSignUp(params: {
  email: string;
  password: string;
  nickName: string;
  phone?: string;
}) {
  const { email, password, nickName, phone } = params;

  // 1) Auth에 계정 생성
  const cred: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const uid = cred.user.uid;

  // 2) Firestore /users/{uid} 문서 생성
  await setDoc(doc(db, 'users', uid), {
    nickName,
    email,
    avatarUrl: '', // Storage 붙이고 수정
    familyId: null,
    roleInFamily: null,
    orderInChild: null,
    totalPoints: 0,
    phone: phone ?? null,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });

  return { uid };
}

/**
 * 로그인: Firebase Auth → Firestore user 프로필 조회
 */
export async function apiLogin(email: string, password: string) {
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

  return { uid, profile };
}
