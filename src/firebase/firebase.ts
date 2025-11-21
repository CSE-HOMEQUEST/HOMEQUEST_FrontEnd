// Import the functions you need from the SDKs you need
// import { getAnalytics } from "firebase/analytics";
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDO8ZraXqzEvAGSL9qeMhZlzvWRzoBcxFA',
  authDomain: 'homequest-dev.firebaseapp.com',
  projectId: 'homequest-dev',
  storageBucket: 'homequest-dev.firebasestorage.app',
  messagingSenderId: '160354826654',
  appId: '1:160354826654:web:73e14a2b392b7dd55a3e8f',
  measurementId: 'G-8GPH5VK8CP',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 각 서비스 핸들러 꺼내기
export const db = getFirestore(app); // Firestore (DB)
export const auth = getAuth(app); // Authentication (로그인)
// export const analytics = getAnalytics(app); // analytics
