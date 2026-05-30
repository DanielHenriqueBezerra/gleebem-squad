import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import IntroScreen from './src/screens/IntroScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import PreparationScreen from './src/screens/PreparationScreen';
import ScanScreen from './src/screens/ScanScreen';
import ResultScreen from './src/screens/ResultScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';
import ScreenErrorBoundary from './src/components/ScreenErrorBoundary';

import type { ShenaiScanResult } from './src/services/shenai.service';

export type RootStackParamList = {
  Intro: undefined;
  Consent: undefined;
  Home: undefined;
  Loading: { results: ShenaiScanResult };
  Preparation: undefined;
  Scan: undefined;
  Result: { results: ShenaiScanResult };
  Recommendations: { results: ShenaiScanResult };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Intro" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Consent" component={ConsentScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Preparation" component={PreparationScreen} />
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="Result" component={(props: NativeStackScreenProps<RootStackParamList, 'Result'>) => <ScreenErrorBoundary onRetry={() => props.navigation.goBack()}><ResultScreen {...props} /></ScreenErrorBoundary>} />
        <Stack.Screen name="Recommendations" component={(props: NativeStackScreenProps<RootStackParamList, 'Recommendations'>) => <ScreenErrorBoundary onRetry={() => props.navigation.goBack()}><RecommendationsScreen {...props} /></ScreenErrorBoundary>} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
