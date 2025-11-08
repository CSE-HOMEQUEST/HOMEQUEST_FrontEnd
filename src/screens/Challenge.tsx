// src/screens/Challenge.tsx
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export function Challenge() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerLogo}>HomeQuest</Text>

          <TouchableOpacity style={styles.settingButton}>
            {/* <Image
  source={require('../assets/settingbutton.png')}
  style={styles.settingIcon}
/> */}
          </TouchableOpacity>
        </View>

        {/* 중간 내용 */}
        <View style={styles.middleContainer}>
          {/* Frame 영역 나중에 채우기 */}
        </View>

        {/* 페이지 인디케이터 */}
        <View style={styles.pageIndicatorDots}>
          <View style={styles.ellipse} />
          <View style={styles.ellipse2} />
          <View style={styles.ellipse3} />
        </View>

        {/* 맨 아래 탭 바 */}
        <View style={styles.tabBarContainer}>{/* BottomTabBar 자리 */}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  root: { flex: 1, backgroundColor: '#ffffff', width: '100%' },

  header: {
    height: 53,
    marginTop: 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },

  headerLogo: {
    color: '#343434',
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
  },

  settingButton: {
    position: 'absolute',
    right: 20,
    top: 15,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  middleContainer: { flex: 1, paddingHorizontal: 20 },

  pageIndicatorDots: {
    width: 48,
    height: 8,
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  ellipse: {
    width: 8,
    height: 8,
    borderRadius: 3.96,
    backgroundColor: '#d9d9d9',
  },
  ellipse2: {
    width: 8,
    height: 8,
    borderRadius: 3.96,
    backgroundColor: '#949494',
  },
  ellipse3: {
    width: 8,
    height: 8,
    borderRadius: 3.96,
    backgroundColor: '#d9d9d9',
  },

  tabBarContainer: {
    height: 72,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
