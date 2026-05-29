// src/screens/ScanScreen.tsx — TELA 4: Câmera / Scan
import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, TouchableOpacity, View, Alert, Linking } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { executeWellnessScan } from '../services/shenai.service';
import { ShenaiSdkView } from 'react-native-shenai-sdk';
import Svg, { Path } from 'react-native-svg';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Scan'>;
};

export default function ScanScreen({ navigation }: Props) {
  const [showSdk, setShowSdk] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function startShenai() {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Desmontada ao finalizar o scan para evitar overlay sobre as próximas telas */}
      {showSdk && <ShenaiSdkView style={StyleSheet.absoluteFillObject} />}

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
});
