import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Splash() {
  const router = useRouter();

  // 2초 뒤 로그인 화면으로 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login'); // /app/login.tsx로 이동
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>HomeQuest</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5A6FE9', // 배경색 (로고 배경)
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'Agbalumo', // 네가 로그인 화면에서 쓰던 폰트와 동일하게
    fontSize: 36,
    color: '#FFFFFF',
  },
});
