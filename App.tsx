// App.tsx
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

import HomeScreen from './src/screens/HomeScreen'; // ����

export default function App() {
  const [fontsLoaded] = useFonts({
    Agbalumo: require('./assets/fonts/Agbalumo-Regular.ttf'),
    Roboto: require('./assets/fonts/Roboto.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <HomeScreen />;
}
