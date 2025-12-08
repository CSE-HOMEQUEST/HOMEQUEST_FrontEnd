// seedWeeklyContributions.js
// 2025-12-02 ~ 2025-12-08 일주일간 contribution + challengeProgress 시드

const admin = require('firebase-admin');

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const USER_ID = '41LV8xJyJNaaGKi1cFWtrsV8GKi2';
const FAMILY_ID = 'fam_jinjin';

// ---------- 1. 헬퍼 / 메타 로직 ----------

// 요일: Monday=0 ~ Sunday=6 로 맞추기
function toMondayZeroWeekday(jsDay) {
  // JS: Sunday=0, Monday=1 ... Saturday=6
  // 우리가 쓰는 건 Monday=0, ... Sunday=6
  return (jsDay + 6) % 7;
}

// challengeId prefix 기반 category 추론
function inferCategory(challengeId) {
  if (challengeId.startsWith('ch_chores_')) return 'chores';
  if (challengeId.startsWith('ch_health_')) return 'health';
  if (challengeId.startsWith('ch_saving_')) return 'saving';

  if (challengeId.startsWith('daily_')) return 'health';
  if (
    challengeId === 'monthly_heating' ||
    challengeId === 'speed_dishwasher' ||
    challengeId === 'speed_laundry_in'
  ) {
    return 'saving';
  }
  return 'other';
}

// deviceType 대략 추론 (LLM이 구분만 할 수 있으면 되게)
function inferDeviceType(challengeId) {
  if (challengeId.includes('water')) return 'water_purifier';
  if (
    challengeId.includes('laundry') ||
    challengeId.includes('washer') ||
    challengeId.includes('dryer')
  ) {
    return 'washer_dryer';
  }
  if (challengeId.includes('dish')) return 'dishwasher';
  if (challengeId.includes('robot') || challengeId.includes('vacuum'))
    return 'robot_cleaner';
  if (challengeId.includes('trash')) return 'trash_can';
  if (challengeId.includes('fridge')) return 'fridge';
  if (challengeId.includes('ac')) return 'air_conditioner';
  if (challengeId.includes('heater')) return 'heater';
  if (challengeId.includes('light')) return 'light';
  if (challengeId.includes('tv')) return 'tv';
  return 'none';
}

// durationType 추론
function inferDurationType(challengeId) {
  if (challengeId.includes('weekend') || challengeId.includes('weekly'))
    return 'weekly';
  if (challengeId.includes('month')) return 'monthly';
  if (challengeId.startsWith('monthly_')) return 'monthly';
  return 'daily';
}

// progressType은 일단 전부 once로 통일 (필요하면 이후 변경)
function inferProgressType(challengeId) {
  return 'once';
}

// 기본 포인트 규칙 (대략)
function inferPoints(challengeId) {
  const cat = inferCategory(challengeId);
  if (cat === 'health') return { personal: 10, family: 0 };
  if (cat === 'chores') return { personal: 5, family: 0 };
  if (cat === 'saving') return { personal: 3, family: 0 };
  return { personal: 0, family: 0 };
}

// 제목은 daily_water_2만 한국어로 정확히, 나머지는 id를 띄어쓰기 한 placeholder
function inferTitle(challengeId) {
  if (challengeId === 'daily_water_2') return '물 한 잔 마시기';
  // 예: ch_health_family_walk -> "Ch health family walk"
  return challengeId.replace(/_/g, ' ');
}

// challenge 메타 조합
function getChallengeMeta(challengeId) {
  const category = inferCategory(challengeId);
  const deviceType = inferDeviceType(challengeId);
  const durationType = inferDurationType(challengeId);
  const progressType = inferProgressType(challengeId);
  const { personal: rewardPersonalPoints, family: rewardFamilyPoints } =
    inferPoints(challengeId);

  return {
    challengeId,
    challengeTitle: inferTitle(challengeId),
    challengeCategory: category,
    deviceType,
    durationType,
    progressType,
    rewardPersonalPoints,
    rewardFamilyPoints,
    difficultyLevel: 1,
    targetValue: 1,
    unit: '번',
    mode: 'personal', // 가족 챌린지는 필요시 여기서 변경
  };
}

// ---------- 2. 일주일 패턴 정의 ----------

/**
 * WEEKLY_PLAN:
 *  - date: 'YYYY-MM-DD'
 *  - contributions: [
 *      {
 *        challengeId,
 *        time: 'HH:MM:SS',
 *        timeSlot: 'morning' | 'afternoon' | 'evening' | 'night',
 *        value: number,
 *        energyKwh?: number
 *      }
 *    ]
 */
const WEEKLY_PLAN = [
  {
    // 화요일: 밤 늦게 겨우 물 마시기 + 아침 설거지/쓰레기, 밤 절약
    date: '2025-12-02',
    contributions: [
      {
        challengeId: 'ch_chores_morning_dish',
        time: '07:40:00',
        timeSlot: 'morning',
        value: 1,
      },
      {
        challengeId: 'ch_chores_trash_out',
        time: '08:10:00',
        timeSlot: 'morning',
        value: 1,
      },
      {
        challengeId: 'daily_water_2',
        time: '23:05:12',
        timeSlot: 'night',
        value: 1,
      },
      {
        challengeId: 'ch_saving_light_off',
        time: '23:15:33',
        timeSlot: 'night',
        value: 1,
      },
    ],
  },
  {
    // 수요일: 아침 가사 + 저녁 걷기 후 물 마시기
    date: '2025-12-03',
    contributions: [
      {
        challengeId: 'ch_chores_bed_make',
        time: '07:30:00',
        timeSlot: 'morning',
        value: 1,
      },
      {
        challengeId: 'ch_chores_morning_dish',
        time: '07:50:00',
        timeSlot: 'morning',
        value: 1,
      },
      {
        challengeId: 'ch_health_walk_20min',
        time: '21:00:00',
        timeSlot: 'evening',
        value: 1,
      },
      {
        challengeId: 'daily_water_2',
        time: '21:20:00',
        timeSlot: 'evening',
        value: 1,
      },
    ],
  },
  {
    // 목요일: 저녁 세탁 + 요가 + 그 뒤에 물 마시기 (21:37:55, 예시값 그대로 사용)
    date: '2025-12-04',
    contributions: [
      {
        challengeId: 'ch_chores_laundry_start',
        time: '19:10:00',
        timeSlot: 'evening',
        value: 1,
      },
      {
        challengeId: 'speed_laundry_in',
        time: '19:40:00',
        timeSlot: 'evening',
        value: 1,
      },
      {
        challengeId: 'ch_health_home_yoga',
        time: '21:00:00',
        timeSlot: 'evening',
        value: 1,
      },
      {
        challengeId: 'daily_water_2',
        time: '21:37:55',
        timeSlot: 'evening',
        value: 1,
      },
    ],
  },
  {
    // 금요일: 헬스/물/가사는 거의 안 하고 에너지 절약만 잔뜩
    date: '2025-12-05',
    contributions: [
      {
        challengeId: 'ch_saving_tv_off',
        time: '23:30:00',
        timeSlot: 'night',
        value: 1,
      },
      {
        challengeId: 'ch_saving_multitap_off',
        time: '23:35:00',
        timeSlot: 'night',
        value: 1,
      },
      {
        challengeId: 'ch_saving_heater_timer',
        time: '23:40:00',
        timeSlot: 'night',
        value: 1,
      },
    ],
  },
  {
    // 토요일: 가족과 걷기/등산 + 가족 설거지 + 낮에 물 자주 마심
    date: '2025-12-06',
    contributions: [
      {
        challengeId: 'ch_health_family_walk',
        time: '11:00:00',
        timeSlot: 'afternoon',
        value: 1,
      },
      {
        challengeId: 'daily_water_2',
        time: '11:30:00',
        timeSlot: 'afternoon',
        value: 1,
      },
      {
        challengeId: 'ch_health_family_weekend_hike',
        time: '15:00:00',
        timeSlot: 'afternoon',
        value: 1,
      },
      {
        challengeId: 'ch_chores_dish_family',
        time: '19:00:00',
        timeSlot: 'evening',
        value: 1,
      },
      {
        challengeId: 'ch_health_water_1L',
        time: '20:00:00',
        timeSlot: 'evening',
        value: 1,
      },
    ],
  },
  {
    // 일요일: 주간 방 정리 + 로봇청소 + 절수 샤워, 물 챌린지는 또 실패
    date: '2025-12-07',
    contributions: [
      {
        challengeId: 'ch_chores_room_weekly',
        time: '16:00:00',
        timeSlot: 'afternoon',
        value: 1,
      },
      {
        challengeId: 'ch_chores_robot_daily',
        time: '16:30:00',
        timeSlot: 'afternoon',
        value: 1,
      },
      {
        challengeId: 'ch_saving_water_short_shower',
        time: '21:00:00',
        timeSlot: 'evening',
        value: 1,
      },
    ],
  },
  {
    // 다음주 월요일: 아침 스트레칭 + 아침에 물 먼저 마시고, 낮엔 로봇/저녁엔 부엌 정리
    date: '2025-12-08',
    contributions: [
      {
        challengeId: 'ch_health_stretch_morning',
        time: '07:20:00',
        timeSlot: 'morning',
        value: 1,
      },
      {
        challengeId: 'daily_water_2',
        time: '08:00:00',
        timeSlot: 'morning',
        value: 1,
      },
      {
        challengeId: 'daily_robot_clean',
        time: '10:00:00',
        timeSlot: 'morning',
        value: 1,
      },
      {
        challengeId: 'ch_chores_kitchen_clean',
        time: '20:00:00',
        timeSlot: 'evening',
        value: 1,
      },
    ],
  },
];

// ---------- 3. 시드 메인 로직 ----------

async function seedWeeklyContributions() {
  const batch = db.batch();

  // progress 집계용: { [challengeId]: { meta, currentValue, totalEnergyKwh, startedAt, lastEventDate } }
  const progressAgg = {};

  for (const dayPlan of WEEKLY_PLAN) {
    const { date, contributions } = dayPlan;

    const eventDate = new Date(`${date}T00:00:00+09:00`);
    const weekday = toMondayZeroWeekday(eventDate.getDay());

    for (const item of contributions) {
      const { challengeId, time, timeSlot, value, energyKwh = 0 } = item;
      const meta = getChallengeMeta(challengeId);

      const createdAtDate = new Date(`${date}T${time}+09:00`);

      const progressDocRef = db
        .collection('users')
        .doc(USER_ID)
        .collection('challengeProgress')
        .doc(challengeId);

      const contribRef = progressDocRef.collection('contributions').doc();

      const contributionData = {
        actionType: meta.deviceType,
        category: meta.challengeCategory,
        challengeId,
        completed: true,
        completionTime: time,
        createdAt: admin.firestore.Timestamp.fromDate(createdAtDate),
        deviceType: meta.deviceType,
        durationType: meta.durationType,
        energyKwh,
        eventDate: admin.firestore.Timestamp.fromDate(eventDate),
        eventId: contribRef.id,
        familyId: FAMILY_ID,
        familyPoints: meta.rewardFamilyPoints,
        mode: meta.mode,
        personalPoints: meta.rewardPersonalPoints,
        progressType: meta.progressType,
        timeSlot,
        value,
        weekday,
      };

      batch.set(contribRef, contributionData);

      // progress 집계 업데이트
      if (!progressAgg[challengeId]) {
        progressAgg[challengeId] = {
          meta,
          currentValue: 0,
          totalEnergyKwh: 0,
          startedAt: admin.firestore.Timestamp.fromDate(createdAtDate),
          lastEventDate: admin.firestore.Timestamp.fromDate(createdAtDate),
        };
      }

      const agg = progressAgg[challengeId];
      agg.currentValue += value;
      agg.totalEnergyKwh += energyKwh;

      if (createdAtDate < agg.startedAt.toDate()) {
        agg.startedAt = admin.firestore.Timestamp.fromDate(createdAtDate);
      }
      if (createdAtDate > agg.lastEventDate.toDate()) {
        agg.lastEventDate = admin.firestore.Timestamp.fromDate(createdAtDate);
      }
    }
  }

  // progress 문서 쓰기
  Object.entries(progressAgg).forEach(([challengeId, agg]) => {
    const { meta, currentValue, totalEnergyKwh, startedAt, lastEventDate } =
      agg;

    const progressDocRef = db
      .collection('users')
      .doc(USER_ID)
      .collection('challengeProgress')
      .doc(challengeId);

    const progressData = {
      cardId: challengeId,
      challengeCategory: meta.challengeCategory,
      challengeId,
      challengeTitle: meta.challengeTitle,
      currentValue,
      deviceType: meta.deviceType,
      difficultyLevel: meta.difficultyLevel,
      durationType: meta.durationType,
      lastEventDate,
      mode: meta.mode,
      progressType: meta.progressType,
      rewardFamilyPoints: meta.rewardFamilyPoints,
      rewardPersonalPoints: meta.rewardPersonalPoints,
      startedAt,
      status: 'COMPLETED', // 일단 기여가 있으면 COMPLETED로
      targetValue: meta.targetValue,
      totalEnergyKwh,
      unit: meta.unit,
    };

    batch.set(progressDocRef, progressData, { merge: true });
  });

  await batch.commit();
  console.log('✅ Weekly contributions & progress seeded for user:', USER_ID);
}

// 직접 실행 시
if (require.main === module) {
  seedWeeklyContributions()
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
