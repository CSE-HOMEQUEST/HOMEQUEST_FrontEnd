// src/screens/Home.tsx
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageStyle,
  Modal,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

/* ────────────── Header ────────────── */
function Header() {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <View style={styles.header}>
      <Text style={styles.headerLogo}>HomeQuest</Text>
      <TouchableOpacity
        style={styles.settingButton}
        onPress={() => navigation.navigate('Setting')}
      >
        <Image
          source={require('../../assets/bars/SettingButton.png')}
          style={styles.settingIcon}
        />
      </TouchableOpacity>
      <View style={styles.line} />
    </View>
  );
}

/* ────────────── Room View (확대 / 이동 가능) ────────────── */
function RoomBlock() {
  const scale = useSharedValue(0.8);
  const baseScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);
  const navigation = useNavigation<NavigationProp<any>>();

  // Pinch & Pan Gesture 설정
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = baseScale.value * e.scale;
    })
    .onEnd(() => {
      baseScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = lastTranslateX.value + e.translationX;
      translateY.value = lastTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
      <Animated.View style={[styles.roomBlock, animatedStyle]}>
        {/* 방 이미지 */}
        <Image
          source={require('../../assets/rooms/room_1.png')}
          style={[styles.roomBase, styles.room1]}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/rooms/room_2.png')}
          style={[styles.roomBase, styles.room2]}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/rooms/room_3.png')}
          style={[styles.roomBase, styles.room3]}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/rooms/room_4.png')}
          style={[styles.roomBase, styles.room4]}
          resizeMode="cover"
        />

        {/* 캐릭터 */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Character')}
          style={styles.characterTouchable}
        >
          <Image
            source={require('../../assets/rooms/dong.png')}
            style={styles.character}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Character_2')}
          style={styles.character2Touchable}
        >
          <Image
            source={require('../../assets/rooms/jin.png')}
            style={styles.character2}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* 가구 / 오브젝트 */}
        <Image
          source={require('../../assets/rooms/desk.png')}
          style={styles.table}
          resizeMode="cover"
        />

        <Image
          source={require('../../assets/rooms/desk_2.png')}
          style={styles.table2}
          resizeMode="cover"
        />

        {/* LG 로고 */}
        <View style={styles.lgLogo}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Image
              key={i}
              source={require('../../assets/rooms/LG_logo.png')}
              style={[
                styles.logoBase,
                styles[`logo${i + 1}` as keyof typeof styles] as ImageStyle,
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

/* ────────────── Help Icons ────────────── */
function HelpIcons({ onReportPress }: { onReportPress: () => void }) {
  return (
    <View style={styles.helpIconsContainer}>
      <TouchableOpacity activeOpacity={0.7}>
        <Image
          source={require('../../assets/bars/add.png')}
          style={styles.helpAdd}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.7} onPress={onReportPress}>
        <Image
          source={require('../../assets/bars/report.png')}
          style={styles.helpReport}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

/* ────────────── Today’s Report Popup ────────────── */
function TodayReportPopup({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>Today’s Report</Text>

          {/* AI 분석 */}
          <View style={styles.aiBox}>
            <Text style={styles.aiLabel}>AI 패턴 분석 :</Text>
            <Text style={styles.aiText}>
              누나는 월요일마다 늦게 집에 들어오네요.{'\n'}
              아침 설거지로 가사 챌린지를 미리 수행해보는 건{'\n'}어떨까요?
            </Text>
          </View>

          <View style={styles.line2} />

          {/* 챌린지 요약 */}
          <View style={styles.challengeBox}>
            <Image
              source={require('../../assets/main_icon/Subtract.png')}
              style={styles.challengeIcon}
            />
            <Text style={styles.challengeText}>
              이번 달의 가족 챌린지 : 난방 절약 성공!
            </Text>
            <Text style={styles.point}>+40p</Text>
          </View>

          <View style={styles.challengeBox}>
            <Image
              source={require('../../assets/main_icon/Subtract.png')}
              style={styles.challengeIcon}
            />
            <Text style={styles.challengeText}>
              이번 주의 가족 챌린지 : {'\n'}릴레이 로봇청소기 돌리기 성공
            </Text>
            <Text style={styles.point}>+50p</Text>
          </View>

          <View style={styles.challengeBox}>
            <Image
              source={require('../../assets/main_icon/Subtract.png')}
              style={styles.challengeIcon}
            />
            <Text style={styles.challengeText}>
              오늘의 개인 챌린지 : 아침에 물 한잔 마시기
            </Text>
            <Text style={styles.point}>+10p</Text>
          </View>

          {/* 확인 버튼 */}
          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ────────────── Bottom Tab Bar ────────────── */
function BottomTabBar() {
  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity activeOpacity={0.7} style={styles.tabButton}>
        <Image
          source={require('../../assets/bars/home.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.tabButton}
        onPress={() => router.push('/two')}
      >
        <Image
          source={require('../../assets/bars/challenge.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.tabButton}
        onPress={() => router.push('/three')}
      >
        <Image
          source={require('../../assets/bars/reward.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.tabButton}
        onPress={() => router.push('/four')}
      >
        <Image
          source={require('../../assets/bars/ranking.png')}
          style={styles.tabIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

/* ────────────── Home Screen ────────────── */
export default function Home() {
  const [reportVisible, setReportVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      <View style={styles.contentContainer}>
        <RoomBlock />
        <HelpIcons onReportPress={() => setReportVisible(true)} />
      </View>

      <BottomTabBar />

      {/* Report Modal */}
      <TodayReportPopup
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
      />
    </SafeAreaView>
  );
}

/* ────────────── Styles ────────────── */
const styles = StyleSheet.create({
  // 기본 구조
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // Header
  header: {
    width: '100%',
    height: 53,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: { fontFamily: 'Agbalumo', fontSize: 20, color: '#353535' },
  settingButton: { position: 'absolute', right: 14, top: 15 },
  settingIcon: { width: 24, height: 24, tintColor: '#353535' },
  line: {
    position: 'absolute',
    bottom: 0,
    height: 1,
    width: '100%',
    backgroundColor: '#E0E0E0',
  },

  // Room Layout
  roomBlock: {
    width: 418,
    height: 564,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  roomBase: { position: 'absolute' },
  room1: { width: 225, height: 232, left: 96, top: -6 },
  room2: { width: 251, height: 251, top: 318, left: 89 },
  room3: { width: 234, height: 236, top: 160, left: 0 },
  room4: { width: 232, height: 232, top: 164, left: 186 },

  characterTouchable: {
    position: 'absolute',
    top: 90,
    left: 175,
    width: 65,
    height: 85,
    zIndex: 5,
  },
  character: {
    position: 'absolute',
    width: 65,
    height: 85,
    resizeMode: 'contain',
  },

  character2Touchable: {
    position: 'absolute',
    top: 420, // 원하는 위치로 조정
    left: 218, // 원하는 위치로 조정
    width: 65,
    height: 85,
    zIndex: 5,
  },
  character2: {
    position: 'absolute',
    width: 65,
    height: 85,
    resizeMode: 'contain',
  },

  table: {
    position: 'absolute',
    width: 50,
    height: 30,
    top: 155,
    left: 160,
    resizeMode: 'contain',
    zIndex: 5,
  },

  table2: {
    position: 'absolute',
    width: 85,
    height: 65,
    top: 465,
    left: 193,
    resizeMode: 'contain',
    zIndex: 5,
  },

  // LG Logos
  lgLogo: { position: 'absolute', top: 70, left: 127, width: 212, height: 345 },
  logoBase: { position: 'absolute', width: 57, height: 46 },
  logo1: { top: 299, left: 1 },
  logo2: { top: 272, left: 78 },
  logo3: { top: 139, left: 95 },
  logo4: { top: 145, left: 155 },
  logo5: { top: 168, left: 32 },
  logo6: { top: 0, left: 0 },
  logo7: { top: 71, left: 78 },

  // Help Icons
  helpIconsContainer: {
    position: 'absolute',
    bottom: 22,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 360,
    zIndex: 10,
  },
  helpAdd: { width: 33, height: 33 },
  helpReport: { width: 27, height: 27, tintColor: 'rgba(54,54,54,1)' },

  // Popup
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportCard: {
    width: 335,
    height: 387,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    elevation: 8,
  },
  reportTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#353535',
    marginBottom: 5,
  },
  aiBox: {
    width: 275,
    height: 89,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: 'space-around',
    alignSelf: 'center',
  },
  aiLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#A0A0A0',
    left: 3,
  },
  aiText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#000',
    lineHeight: 15,
    left: 7,
    marginTop: 3,
    marginBottom: 3,
  },
  line2: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginVertical: 8,
  },
  challengeBox: {
    backgroundColor: '#F6F6F6',
    marginTop: 4,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#000',
    flex: 1,
    textAlignVertical: 'center',
  },
  point: {
    fontFamily: 'Roboto-Medium',
    fontSize: 12,
    color: '#FF4D4F',
  },
  challengeIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    resizeMode: 'contain',
  },
  confirmButton: {
    backgroundColor: '#353535',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
    alignItems: 'center',
    width: 293,
    height: 43,
  },
  confirmText: {
    color: '#fff',
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
  },

  // Bottom Tab
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 75,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  tabButton: { paddingVertical: 8, paddingHorizontal: 12 },
  tabIcon: { width: 50, height: 50 },
});
