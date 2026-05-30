// src/screens/ScanScreen.tsx — TELA 4: Câmera / Scan
import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, TouchableOpacity, View, Alert, Linking, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { CameraView } from 'expo-camera';
import { RootStackParamList } from '../../App';
import { executeWellnessScan, requestCameraPermission } from '../services/shenai.service';
import Svg, { Path } from 'react-native-svg';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Scan'>;
};

const isExpoGo = Constants.appOwnership === 'expo';
const ShenaiSdkView = isExpoGo ? null : require('react-native-shenai-sdk').ShenaiSdkView;

export default function ScanScreen({ navigation }: Props) {
  const [showSdk, setShowSdk] = useState(false);
  const [hasExpoCameraPermission, setHasExpoCameraPermission] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function startShenai() {
      const hasPermission = await requestCameraPermission();
      if (isCancelled) return;

      if (!hasPermission) {
        Alert.alert(
          'Permissao da camera',
          'Autorize o acesso a camera para realizar a medicao.',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => navigation.goBack() },
            {
              text: 'Abrir Configuracoes',
              onPress: () => {
                Linking.openSettings();
                navigation.goBack();
              },
            },
          ]
        );
        return;
      }

      if (isExpoGo) {
        setHasExpoCameraPermission(true);
        return;
      }

      setShowSdk(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      if (isCancelled) return;

      const result = await executeWellnessScan();
      if (isCancelled) return;
      if (result) {
        // Desmonta a view nativa antes de navegar para evitar overlay preto
        setShowSdk(false);
        navigation.replace('Loading', { results: result });
      } else {
        setShowSdk(false);
        Alert.alert(
          'Medição não concluída',
          'A câmera não foi autorizada ou ocorreu um erro durante o scan. Verifique as permissões do app nas configurações do dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => navigation.goBack() },
            {
              text: 'Abrir Configurações',
              onPress: () => {
                Linking.openSettings();
                navigation.goBack();
              },
            },
          ]
        );
      }
    }

    startShenai();

    return () => {
      isCancelled = true;
    };
  }, [navigation]);

  async function finishExpoGoCameraTest() {
    const result = await executeWellnessScan();
    if (result) {
      navigation.replace('Loading', { results: result });
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Desmontada ao finalizar o scan para evitar overlay sobre as próximas telas */}
      {showSdk && ShenaiSdkView && <ShenaiSdkView style={StyleSheet.absoluteFillObject} />}
      {isExpoGo && hasExpoCameraPermission && (
        <View style={StyleSheet.absoluteFillObject}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="front" />
          <View style={styles.expoGoFooter}>
            <Text style={styles.expoGoTitle}>Teste de camera</Text>
            <Text style={styles.expoGoText}>
              Expo Go mostra a camera real, mas nao executa metricas Shen.ai.
            </Text>
            <TouchableOpacity style={styles.demoBtn} onPress={finishExpoGoCameraTest} activeOpacity={0.85}>
              <Text style={styles.demoBtnText}>Usar resultado demo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Apenas um botão de voltar caso o usuário queira cancelar manualmente antes do SDK */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
            <Path d="M11 4L6 9l5 5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#0C1820' 
  },
  headerRow: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 999,
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expoGoFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 26,
    backgroundColor: 'rgba(12, 24, 32, 0.86)',
    borderRadius: 8,
    padding: 16,
  },
  expoGoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  expoGoText: {
    color: '#D7E6EC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  demoBtn: {
    backgroundColor: '#4BA4CE',
    borderRadius: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
