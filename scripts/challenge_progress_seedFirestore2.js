// 엑셀(challenge_events.xlsx)을 읽어서
// users/{userId}/challengeProgress + contributions
// families/{familyId}/challengeProgress + contributions 를 생성하는 스크립트

const path = require('path');

const admin = require('firebase-admin');
const xlsx = require('xlsx');

// -----------------------------
// 1. Firebase Admin 초기화
// -----------------------------
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// -----------------------------
// 2. 엑셀 로드
// -----------------------------
const EXCEL_PATH = path.join(__dirname, 'challenge_events.xlsx');

const wb = xlsx.readFile(EXCEL_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
// defval: null 로 해서 빈 셀도 키는 유지
const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

console.log(`[info] loaded ${rows.length} rows from Excel`);

// -----------------------------
// 3. /challenges 메타 미리 로드
// -----------------------------
async function loadChallengeMeta() {
  const meta = {};
  const snap = await db.collection('challenges').get();
  snap.forEach((doc) => {
    meta[doc.id] = doc.data() || {};
  });
  console.log(`[info] loaded ${Object.keys(meta).length} challenges meta`);
  return meta;
}

// -----------------------------
// 4. 보조 함수들
// -----------------------------
function parseTimeToHms(timestr) {
  // 'HH:MM:SS' -> [h,m,s], 없거나 이상하면 null
  if (timestr === null || timestr === undefined || timestr === '') return null;
  const s = String(timestr);
  const parts = s.split(':');
  if (parts.length < 2) return null;
  try {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const sec = parts.length > 2 ? parseInt(parts[2], 10) || 0 : 0;
    return [h, m, sec];
  } catch (e) {
    return null;
  }
}

function combineDatetime(dateValue, timeStr) {
  // dateValue: JS Date 또는 엑셀 숫자일 수도 있음
  if (!dateValue) return null;

  let base;
  if (dateValue instanceof Date) {
    base = new Date(dateValue.getTime());
  } else if (typeof dateValue === 'number') {
    // 엑셀 날짜 숫자라면 (일 수 기준)
    // Excel epoch(1899-12-30) 기준
    base = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
  } else {
    base = new Date(dateValue);
  }

  const hms = parseTimeToHms(timeStr);
  if (!hms) {
    base.setHours(0, 0, 0, 0);
    return base;
  }
  const [h, m, s] = hms;
  base.setHours(h, m, s, 0);
  return base;
}

function safeFloat(x) {
  if (x === null || x === undefined || x === '') return 0;
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function isEmpty(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  return false;
}

function toTimestampOrNull(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime()))
    return null;
  return admin.firestore.Timestamp.fromDate(date);
}

function cleanDoc(obj) {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      out[k] = v;
    }
  });
  return out;
}

// -----------------------------
// 5. 그룹핑 유틸 (userId+challengeId / familyId+challengeId)
// -----------------------------
function groupBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

// -----------------------------
// 6. progress 문서 생성 로직
// -----------------------------
function makeProgressDoc(groupRows, challengeId, challengeMeta, isUser) {
  const completedArr = groupRows.map((r) => (safeFloat(r.completed) ? 1 : 0));
  const numCompleted = completedArr.reduce((sum, v) => sum + v, 0);
  const totalEvents = groupRows.length;

  const dates = groupRows
    .map((r) => {
      const d = r.eventDate;
      if (!d) return null;
      if (d instanceof Date) return d;
      if (typeof d === 'number') {
        // 엑셀 날짜 숫자
        return new Date(Math.round((d - 25569) * 86400 * 1000));
      }
      return new Date(d);
    })
    .filter((d) => d && !Number.isNaN(d.getTime()));

  const firstDate = dates.length
    ? new Date(Math.min(...dates.map((d) => d.getTime())))
    : null;
  const lastDate = dates.length
    ? new Date(Math.max(...dates.map((d) => d.getTime())))
    : null;

  const totalEnergy = groupRows.reduce(
    (sum, r) => sum + safeFloat(r.energyKwh),
    0,
  );
  const totalPersonal = groupRows.reduce(
    (sum, r) => sum + safeFloat(r.personalPoints),
    0,
  );
  const totalFamily = groupRows.reduce(
    (sum, r) => sum + safeFloat(r.familyPoints),
    0,
  );

  const meta = challengeMeta[challengeId] || {};

  const status =
    totalEvents > 0 && numCompleted === totalEvents ? 'DONE' : 'ONGOING';

  const baseDoc = {
    challengeId,
    cardId: challengeId,
    status,
    currentValue: numCompleted,
    targetValue: totalEvents,
    startedAt: toTimestampOrNull(firstDate),
    endedAt: status === 'DONE' ? toTimestampOrNull(lastDate) : null,
    challengeTitle: meta.title,
    challengeCategory: meta.category,
    mode: meta.mode,
    deviceType: meta.deviceType,
    durationType: meta.durationType,
    progressType: meta.progressType,
    recommendedTimeSlot: meta.recommendedTimeSlot,
    lastEventDate: toTimestampOrNull(lastDate),
    totalEnergyKwh: totalEnergy,
  };

  if (isUser) {
    baseDoc.totalPersonalPoints = totalPersonal;
  } else {
    baseDoc.totalFamilyPoints = totalFamily;
  }

  return cleanDoc(baseDoc);
}

// -----------------------------
// 7. 메인 로직
// -----------------------------
async function main() {
  try {
    const challengeMeta = await loadChallengeMeta();

    // ---------- 7-1. user / family 그룹 만들기 ----------
    const userGroups = groupBy(rows, (r) => {
      const userId = r.userId;
      const challengeId = r.challengeId;
      if (isEmpty(userId) || isEmpty(challengeId)) return null;
      return `${userId}__${challengeId}`;
    });

    const familyGroups = groupBy(rows, (r) => {
      const familyId = r.familyId;
      const challengeId = r.challengeId;
      if (isEmpty(familyId) || isEmpty(challengeId)) return null;
      return `${familyId}__${challengeId}`;
    });

    // ---------- 7-2. 사용자 progress 생성 ----------
    console.log('[info] creating user challengeProgress...');
    for (const [key, groupRows] of userGroups.entries()) {
      const [userId, challengeId] = key.split('__');
      const docData = makeProgressDoc(
        groupRows,
        String(challengeId),
        challengeMeta,
        true,
      );

      const ref = db
        .collection('users')
        .doc(String(userId))
        .collection('challengeProgress')
        .doc(String(challengeId));

      await ref.set(docData);
    }
    console.log('[info] user challengeProgress done.');

    // ---------- 7-3. 가족 progress 생성 ----------
    console.log('[info] creating family challengeProgress...');
    for (const [key, groupRows] of familyGroups.entries()) {
      const [familyId, challengeId] = key.split('__');
      const docData = makeProgressDoc(
        groupRows,
        String(challengeId),
        challengeMeta,
        false,
      );

      const ref = db
        .collection('families')
        .doc(String(familyId))
        .collection('challengeProgress')
        .doc(String(challengeId));

      await ref.set(docData);
    }
    console.log('[info] family challengeProgress done.');

    // ---------- 7-4. contributions 생성 ----------
    console.log('[info] creating contributions...');

    for (const row of rows) {
      const eventId = String(row.eventId ?? '');
      const userId = row.userId != null ? String(row.userId) : '';
      const familyId = row.familyId != null ? String(row.familyId) : '';
      const challengeId =
        row.challengeId != null ? String(row.challengeId) : '';
      if (!eventId || !challengeId) continue;

      const eventDate = row.eventDate;
      const notificationTime = row.notificationTime;
      const completionTime = row.completionTime;

      const createdAtDate = combineDatetime(
        eventDate,
        completionTime || notificationTime,
      );
      const createdAt = toTimestampOrNull(createdAtDate);

      const completed = !!safeFloat(row.completed);

      const commonFields = {
        eventId,
        familyId: familyId || null,
        challengeId,
        category: row.category || null,
        mode: row.mode || null,
        durationType: row.durationType || null,
        progressType: row.progressType || null,
        deviceType: row.deviceType || null,
        timeSlot: row.timeSlot || null,
        eventDate: toTimestampOrNull(
          eventDate instanceof Date
            ? eventDate
            : combineDatetime(eventDate, null),
        ),
        weekday: row.weekday != null ? Number(row.weekday) : null,
        notificationTime: notificationTime || null,
        completionTime: completionTime || null,
        completed,
        personalPoints: safeFloat(row.personalPoints),
        familyPoints: safeFloat(row.familyPoints),
        energyKwh: safeFloat(row.energyKwh),
        actionType: row.deviceType || null,
        proofUrl: null,
        createdAt,
      };

      // ---- user contribution ----
      if (!isEmpty(userId)) {
        const userValue =
          commonFields.personalPoints && commonFields.personalPoints > 0
            ? commonFields.personalPoints
            : completed
              ? 1
              : 0;

        const userData = cleanDoc({
          ...commonFields,
          value: userValue,
        });

        const userRef = db
          .collection('users')
          .doc(userId)
          .collection('challengeProgress')
          .doc(challengeId)
          .collection('contributions')
          .doc(eventId);

        await userRef.set(userData);
      }

      // ---- family contribution ----
      if (!isEmpty(familyId)) {
        const familyValue =
          commonFields.familyPoints && commonFields.familyPoints > 0
            ? commonFields.familyPoints
            : commonFields.energyKwh;

        const familyData = cleanDoc({
          ...commonFields,
          userId: userId || null,
          value: familyValue,
        });

        const familyRef = db
          .collection('families')
          .doc(familyId)
          .collection('challengeProgress')
          .doc(challengeId)
          .collection('contributions')
          .doc(eventId);

        await familyRef.set(familyData);
      }
    }

    console.log('[info] all contributions created.');
  } catch (err) {
    console.error('[error]', err);
  } finally {
    // firestore 연결 정리
    process.exit(0);
  }
}

main();
