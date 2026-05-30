import { PermissionsAndroid, Platform } from 'react-native';
import Constants from 'expo-constants';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Interface padronizada do resultado do Shen.ai
 */
export interface ShenaiScanResult {
  heartRate: number;
  hrvTotal: number;
  stressScore: number;
  respiratoryRate: number;
  measurementId: string;
  wellnessScore: number; // 0-100 — proveniente de getHealthRisks() da Shen.ai
}

const isExpoGo = Constants.appOwnership === 'expo';

function getShenaiSdk(): any | null {
  if (isExpoGo) return null;

  try {
    return require('react-native-shenai-sdk');
  } catch (err) {
    console.warn('SDK nativo Shen.ai indisponivel neste ambiente:', err);
    return null;
  }
}

function getExpoGoMockResult(): ShenaiScanResult {
  return {
    heartRate: 72,
    hrvTotal: 46,
    stressScore: 24,
    respiratoryRate: 15,
    measurementId: 'expo_go_mock',
    wellnessScore: 84,
  };
}

export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
  if (alreadyGranted) return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: "Permissao de Camera",
      message: "O aplicativo precisa de acesso a camera para medir seus sinais vitais.",
      buttonNeutral: "Perguntar depois",
      buttonNegative: "Cancelar",
      buttonPositive: "OK"
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Inicializa o SDK usando a API Key configurada no .env
 */
export async function initializeShenAI(): Promise<boolean> {
  const shenai = getShenaiSdk();
  if (!shenai) return false;

  const apiKey = process.env.EXPO_PUBLIC_SHENAI_API_KEY || '';
  if (!apiKey) {
    console.error('API Key da Shen.ai não encontrada no .env');
    return false;
  }

  const userId = 'user_demo_gleebem_123';
  
  try {
    const result = await shenai.initialize(apiKey, userId, {
      showUserInterface: true,
      enableStartAfterSuccess: true,
      enableSummaryScreen: false,
      measurementPreset: shenai.MeasurementPreset.THIRTY_SECONDS_ALL_METRICS,
    });

    if (result === shenai.InitializationResult.OK) {
      console.log('✅ Shen.ai SDK Inicializado com Sucesso!');
      try {
        await shenai.setLanguage('pt');
        await shenai.setCustomColorTheme({
          themeColor: '#4BA4CE',
          textColor: '#FFFFFF',
          backgroundColor: '#0C1820',
          tileColor: '#0F2030',
          buttonMainColor: '#FFFFFF',
          buttonSecondaryColor: '#0F2030',
        });
      } catch (e) {
        console.warn('Erro ao aplicar tema/idioma:', e);
      }

      return true;
    } else {
      console.error('Falha ao inicializar o SDK. Código de Erro:', result);
      return false;
    }
  } catch (err) {
    console.error('Erro na chamada nativa do SDK:', err);
    return false;
  }
}


/**
 * Pede permissão e inicia a medição (executeWellnessScan)
 */
export async function executeWellnessScan(): Promise<ShenaiScanResult | null> {
  if (isExpoGo) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return getExpoGoMockResult();
  }

  const shenai = getShenaiSdk();
  if (!shenai) return null;
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    console.warn("Permissao de camera negada");
    return null;
  }

  // 2. Inicializar o SDK
  const isInit = await initializeShenAI();
  if (!isInit) return null;

  // Chama o SDK nativo
  await shenai.startMeasurement();

  // Polling para aguardar o fim da medição com dados 100% reais do SDK
  return new Promise(resolve => {
    const interval = setInterval(async () => {
      try {
        const state = await shenai.getMeasurementState();
        
        // MeasurementState.FINISHED = 7
        if (state === 7) {
          clearInterval(interval);
          const results = await shenai.getMeasurementResults();
          if (results) {
            const final = await saveShenaiResultToFirebase(results);
            resolve(final);
          } else {
            resolve(null); // Falha ao ler resultados
          }
        } 
        // MeasurementState.FAILED = 8
        else if (state === 8) {
          clearInterval(interval);
          resolve(null); // Medição falhou ou foi cancelada
        }
      } catch (e) {
        clearInterval(interval);
        resolve(null);
      }
    }, 1000);
  });
}

/**
 * Salva o resultado final no Firebase após a captura.
 * O Wellness Score é obtido diretamente de getHealthRisks() da Shen.ai.
 */
export async function saveShenaiResultToFirebase(results: any): Promise<ShenaiScanResult | null> {
  if (!results) return null;

  const shenai = getShenaiSdk();

  // Buscar o Wellness Score real da API da Shen.ai (0-100)
  // Conforme documentação: getHealthRisks() retorna { wellnessScore: number | null, ... }
  let wellnessScore = 0;
  try {
    const healthRisks = shenai ? await shenai.getHealthRisks() : null;
    if (healthRisks && healthRisks.wellnessScore !== null && healthRisks.wellnessScore !== undefined) {
      // Normalizar: se vier no formato 0.0-1.0, converter para 0-100
      const raw = healthRisks.wellnessScore;
      wellnessScore = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
      console.log('✅ Wellness Score real da Shen.ai:', wellnessScore);
    }
  } catch (e) {
    console.warn('⚠️ Não foi possível obter o Wellness Score. Usando fallback calculado:', e);
    // Fallback: score aproximado com base nos sinais capturados
    const hr = results.heartRateBpm || 0;
    const hrv = results.hrvSdnnMs || 0;
    const stress = results.stressIndex || 0;
    const hrScore  = (hr >= 60 && hr <= 100) ? 30 : 15;
    const hrvScore = hrv > 40 ? 30 : hrv > 20 ? 20 : 10;
    const stressScore = stress < 30 ? 40 : stress < 60 ? 25 : 10;
    wellnessScore = Math.min(100, hrScore + hrvScore + stressScore);
    console.log('ℹ️ Wellness Score por fallback:', wellnessScore);
  }

  try {
    const userId = 'user_demo_gleebem_123';
    const testsCollectionRef = collection(db, 'users', userId, 'wellness_tests');

    const hr     = Math.round(results.heartRateBpm     || 0);
    const hrv    = Math.round(results.hrvSdnnMs        || 0);
    const stress = Math.round(results.stressIndex      || 0);
    const br     = Math.round(results.breathingRateBpm || 0);

    const newDoc = await addDoc(testsCollectionRef, {
      userId,
      status: 'completed',
      createdAt: serverTimestamp(),
      provider: 'shenai',
      shenai: { measurementId: 'real_scan' },
      rawMetrics: {
        heartRate: { value: hr, status: hr > 60 && hr < 100 ? 'normal' : 'attention' },
        hrv: { sdnn: hrv, status: 'normal' },
        stressLevel: { score: stress, status: stress > 70 ? 'attention' : 'normal' },
        respiratoryRate: { value: br, status: 'normal' },
        wellnessScore: { value: wellnessScore, status: wellnessScore >= 70 ? 'normal' : 'attention' }
      }
    });

    console.log('✅ Resultado salvo no Firestore! ID:', newDoc.id);
    return { heartRate: hr, hrvTotal: hrv, stressScore: stress, respiratoryRate: br, measurementId: newDoc.id, wellnessScore };
  } catch (err: any) {
    console.error('Erro ao salvar no Firestore:', err.message);
    const hr     = Math.round(results.heartRateBpm     || 0);
    const hrv    = Math.round(results.hrvSdnnMs        || 0);
    const stress = Math.round(results.stressIndex      || 0);
    const br     = Math.round(results.breathingRateBpm || 0);
    return { heartRate: hr, hrvTotal: hrv, stressScore: stress, respiratoryRate: br, measurementId: 'offline_scan', wellnessScore };
  }
}


