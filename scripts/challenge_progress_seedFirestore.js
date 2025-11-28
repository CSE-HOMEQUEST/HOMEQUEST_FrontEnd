// dataset/challenge_progress_seedFirestore.js

const path = require('path');

const admin = require('firebase-admin');
const xlsx = require('xlsx');

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * 엑셀에서 넘어온 값 => JS Date 로 변환
 */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * deviceType 에서 actionType 유도
 */
function getActionType(deviceType) {
  switch (deviceType) {
    case 'dishwasher':
      return 'RUN_DISHWASHER';
    case 'water_purifier':
      return 'DRINK_WATER';
    case 'heating':
      return 'HEATING';
    default:
      return 'GENERIC_ACTION';
  }
}

/**
 * durationType 에 따라 대략적인 targetValue 예시
 * (필요하면 숫자 바꿔도 됨)
 */
function getTargetValue(durationType, completedCount) {
  if (durationType === 'daily') return 1; // 1일 기준
  if (durationType === 'weekly') return 7; // 4주 기준
  return completedCount || 1;
}

async function main() {
  console.log('🚀 Start seeding challengeProgress from Excel');

  // 1) 엑셀 읽기
  const workbook = xlsx.readFile(path.join(__dirname, 'challenge_events.xlsx'));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`📄 Loaded ${rows.length} rows from challenge_events.xlsx`);

  // 2) Firestore의 /challenges 전체를 미리 맵으로 가져오기
  const challengeSnap = await db.collection('challenges').get();
  const challengeMap = {};
  challengeSnap.forEach((doc) => {
    challengeMap[doc.id] = doc.data();
  });
  console.log(`🔥 Loaded ${challengeSnap.size} challenge templates`);

  // 3) (mode, ownerId, challengeId) 기준으로 그룹핑
  //    - 개인: ownerId = userId
  //    - 가족: ownerId = familyId
  /** @type {Record<string, any[]>} */
  const grouped = {};

  for (const row of rows) {
    const mode = row.mode; // 'personal' | 'family'
    const challengeId = row.challengeId;
    const ownerId = mode === 'family' ? row.familyId : row.userId;

    if (!mode || !challengeId || !ownerId) {
      console.warn('⚠️ skip row (missing mode/challengeId/ownerId):', row);
      continue;
    }

    const key = `${mode}__${ownerId}__${challengeId}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  console.log(`🔑 Grouped into ${Object.keys(grouped).length} progress docs`);

  let writeCount = 0;
  let batch = db.batch();

  for (const [key, events] of Object.entries(grouped)) {
    const [mode, ownerId, challengeId] = key.split('__');
    const challenge = challengeMap[challengeId];

    if (!challenge) {
      console.warn(`⚠️ No challenge doc for id: ${challengeId}, skip group`);
      continue;
    }

    const isFamily = mode === 'family';
    const rootCollection = isFamily ? 'families' : 'users';

    // progressId: challengeId + ownerId 조합 (임의)
    const progressId = `${challengeId}_${ownerId}`;

    const progressRef = db
      .collection(rootCollection)
      .doc(ownerId)
      .collection('challengeProgress')
      .doc(progressId);

    // ----- progress doc 필드 계산 -----
    const completedCount = events.filter(
      (e) => e.completed === 1 || e.completed === true,
    ).length;

    const targetValue = getTargetValue(challenge.durationType, completedCount);
    const currentValue = completedCount;

    // 시작/종료 시각: 이벤트들 중 최소/최대 값 사용
    let startedAt = null;
    let endedAt = null;

    for (const e of events) {
      const d = toDate(e.completionTime || e.eventDate);
      if (!d) continue;
      if (!startedAt || d < startedAt) startedAt = d;
      if (!endedAt || d > endedAt) endedAt = d;
    }

    const status =
      currentValue >= targetValue
        ? 'DONE'
        : currentValue > 0
          ? 'ONGOING'
          : 'EXPIRED';

    batch.set(
      progressRef,
      {
        challengeId,
        cardId: challenge.cardId || challengeId, // cardId가 없으면 id로 대체
        status,
        currentValue,
        targetValue,
        startedAt: startedAt || admin.firestore.FieldValue.serverTimestamp(),
        endedAt: endedAt || null,
        // denormalized from /challenges
        challengeTitle: challenge.title,
        challengeCategory: challenge.category, // 'chores', 'health', 'saving' 등
      },
      { merge: true },
    );
    writeCount++;

    // ----- contributions 서브컬렉션 -----
    for (const e of events) {
      const contribRef = progressRef.collection('contributions').doc();

      const createdAt =
        toDate(e.completionTime) || toDate(e.eventDate) || new Date();

      const value = isFamily
        ? (e.familyPoints ?? e.energyKwh ?? 0)
        : (e.personalPoints ?? 0);

      const contribData = {
        value,
        actionType: getActionType(e.deviceType),
        proofUrl: null,
        createdAt,
      };

      // 가족 챌린지인 경우 누가 했는지도 기록
      if (isFamily) {
        contribData.userId = e.userId || null;
      }

      batch.set(contribRef, contribData);
      writeCount++;

      // Firestore batch limit 보호용: 400개마다 커밋
      if (writeCount >= 400) {
        await batch.commit();
        console.log('✅ Committed 400 writes');
        batch = db.batch();
        writeCount = 0;
      }
    }
  }

  // 남은 배치 커밋
  if (writeCount > 0) {
    await batch.commit();
    console.log(`✅ Committed last ${writeCount} writes`);
  }

  console.log('🎉 Seeding finished.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error while seeding', err);
  process.exit(1);
});
