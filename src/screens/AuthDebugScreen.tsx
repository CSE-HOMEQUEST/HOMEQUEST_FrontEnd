import React from 'react';
import { Alert, Button, View } from 'react-native';

import { apiLogin, apiSignUp } from '../services/authService';

export default function AuthDebugScreen() {
  const handleSignUp = async () => {
    try {
      const { uid } = await apiSignUp({
        email: 'test1@example.com',
        password: 'test1234',
        nickName: '동동이',
      });
      Alert.alert('회원가입 성공', `uid: ${uid}`);
    } catch (e: any) {
      Alert.alert('에러', e.message ?? String(e));
    }
  };

  const handleLogin = async () => {
    try {
      const { uid, profile } = await apiLogin('test1@example.com', 'test1234');
      Alert.alert('로그인 성공', `uid: ${uid}, nickName: ${profile.nickName}`);
    } catch (e: any) {
      Alert.alert('에러', e.message ?? String(e));
    }
  };

  return (
    <View>
      <Button title="테스트 회원가입" onPress={handleSignUp} />
      <Button title="테스트 로그인" onPress={handleLogin} />
    </View>
  );
}
