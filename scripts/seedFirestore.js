// Firestore에 엑셀 데이터 시드하는 스크립트

// 사용 전 준비사항:
// 1) 프로젝트 루트에 serviceAccountKey.json 저장 (Firebase 콘솔 > 서비스 계정)
// 2) 프로젝트 루트에 users.xlsx, families.xlsx, challenges.xlsx, challenge_events.xlsx 저장
// 3) 루트에서 npm 설치:
//    npm install firebase-admin xlsx
//
// 실행:
//    node scripts/seedFirestore.js
//

const path = require('path');

const admin = require('firebase-admin');
const xlsx = require('xlsx');

// --------------------------------------------------------
// 0. Firebase Admin 초기화
// --------------------------------------------------------

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// --------------------------------------------------------
// 1. 유틸 함수들
// --------------------------------------------------------

// 엑셀 파일 읽기 (첫 번째 시트 기준)
function readXlsx(filename) {
  const filePath = path.join(__dirname, filename);
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);
  console.log(`📄 ${filename}: ${rows.length} rows`);
  return rows;
}

// Firestore batch 500개 제한을 고려한 chunking
function chunkArray(arr, size = 400) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// 숫자 변환 helper
function toNumber(val, defaultVal = 0) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const n = Number(val);
  return Number.isNaN(n) ? defaultVal : n;
}

// boolean 변환 helper (0/1, "0"/"1" 등)
function toBoolean(val) {
  if (typeof val === 'boolean') return val;
  const n = Number(val);
  return !!n;
}

// --------------------------------------------------------
// 2. 각 컬렉션별 import 함수
// --------------------------------------------------------

// users.xlsx → /users/{userId}
async function importUsers() {
  console.log('=== users import 시작 ===');
  const rows = readXlsx('users.xlsx');

  const chunks = chunkArray(rows, 400);
  let total = 0;

  for (const chunk of chunks) {
    const batch = db.batch();

    chunk.forEach((row) => {
      const userId = String(row.userId);
      const ref = db.collection('users').doc(userId);

      batch.set(ref, {
        familyId: row.familyId ? String(row.familyId) : null,
        nickName: row.nickName || '',
        email: row.email || '',
        avatarUrl: row.avatarUrl || '',
        roleInFamily: row.roleInFamily || null,
        orderInChild:
          row.orderInChild === '' ||
          row.orderInChild === null ||
          row.orderInChild === undefined
            ? null
            : toNumber(row.orderInChild, null),
        label: row.label || null,
        totalPoints: toNumber(row.totalPoints, 0),
        // createdAt / lastLoginAt 은 일단 문자열 그대로 저장 (필요하면 나중에 Timestamp 변환)
        createdAt: row.createdAt || null,
        lastLoginAt: row.lastLoginAt || null,
      });
    });

    await batch.commit();
    total += chunk.length;
    console.log(`✅ users: ${total}/${rows.length} 업로드`);
  }

  console.log('=== users import 완료 ===');
}

// families.xlsx → /families/{familyId}
async function importFamilies() {
  console.log('=== families import 시작 ===');
  const rows = readXlsx('families.xlsx');

  const chunks = chunkArray(rows, 400);
  let total = 0;

  for (const chunk of chunks) {
    const batch = db.batch();

    chunk.forEach((row) => {
      const familyId = String(row.familyId);
      const ref = db.collection('families').doc(familyId);

      batch.set(ref, {
        familyName: row.familyName || '',
        totalFamilyPoints: toNumber(row.totalFamilyPoints, 0),
        rank: toNumber(row.rank, 0),
        createdAt: row.createdAt || null,
      });
    });

    await batch.commit();
    total += chunk.length;
    console.log(`✅ families: ${total}/${rows.length} 업로드`);
  }

  console.log('=== families import 완료 ===');
}

// challenges.xlsx → /challenges/{challengeId}
async function importChallenges() {
  console.log('=== challenges import 시작 ===');
  const rows = readXlsx('challenges.xlsx');

  const chunks = chunkArray(rows, 400);
  let total = 0;

  for (const chunk of chunks) {
    const batch = db.batch();

    chunk.forEach((row) => {
      const challengeId = String(row.challengeId);
      const ref = db.collection('challenges').doc(challengeId);

      batch.set(ref, {
        title: row.title || '',
        description: row.description || '',
        category: row.category || '',
        mode: row.mode || '',
        durationType: row.durationType || '',
        progressType: row.progressType || '',
        deviceType: row.deviceType || '',
        difficultyLevel: toNumber(row.difficultyLevel, 0),
        basePersonalPoints: toNumber(row.basePersonalPoints, 0),
        baseFamilyPoints: toNumber(row.baseFamilyPoints, 0),
        recommendedTimeSlot: row.recommendedTimeSlot || '',
        createdAt: row.createdAt || null,
      });
    });

    await batch.commit();
    total += chunk.length;
    console.log(`✅ challenges: ${total}/${rows.length} 업로드`);
  }

  console.log('=== challenges import 완료 ===');
}

// challenge_events.xlsx → /families/{familyId}/challengeEvents/{eventId}
async function importChallengeEvents() {
  console.log('=== challenge_events import 시작 ===');
  const rows = readXlsx('challenge_events.xlsx');

  const chunks = chunkArray(rows, 400);
  let total = 0;

  for (const chunk of chunks) {
    const batch = db.batch();

    chunk.forEach((row) => {
      const familyId = String(row.familyId);
      const eventId = String(row.eventId);

      const ref = db
        .collection('families')
        .doc(familyId)
        .collection('challengeEvents')
        .doc(eventId);

      batch.set(ref, {
        familyId: familyId,
        userId: row.userId ? String(row.userId) : null,
        challengeId: row.challengeId ? String(row.challengeId) : null,
        category: row.category || '',
        mode: row.mode || '',
        durationType: row.durationType || '',
        progressType: row.progressType || '',
        deviceType: row.deviceType || '',
        eventDate: row.eventDate || '', // "2025-11-03"
        weekday: toNumber(row.weekday, 0), // 0~6
        notificationTime: row.notificationTime || '', // "07:00:00"
        completionTime: row.completionTime || '',
        completed: toBoolean(row.completed),
        timeSlot: row.timeSlot || '',
        personalPoints: toNumber(row.personalPoints, 0),
        familyPoints: toNumber(row.familyPoints, 0),
        energyKwh: Number(row.energyKwh) || 0,
      });
    });

    await batch.commit();
    total += chunk.length;
    console.log(`✅ challengeEvents: ${total}/${rows.length} 업로드`);
  }

  console.log('=== challenge_events import 완료 ===');
}

// --------------------------------------------------------
// 3. 메인 실행
// --------------------------------------------------------

async function main() {
  try {
    console.log('Firestore 시드 시작');

    await importFamilies();
    await importUsers();
    await importChallenges();
    await importChallengeEvents();

    console.log('모든 데이터 업로드 완료');
    process.exit(0);
  } catch (err) {
    console.error('업로드 중 에러 발생:', err);
    process.exit(1);
  }
}

main();
