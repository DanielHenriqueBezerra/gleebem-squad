import { saveShenaiResultToFirebase } from '../services/shenai.service';

// Mock do Firebase
jest.mock('../services/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(() => Promise.resolve({ id: 'firestore-doc-123' })),
  serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
}));

// Mock das funções nativas do SDK
jest.mock('react-native-shenai-sdk', () => ({
  initialize: jest.fn(),
  getHealthRisks: jest.fn(),
  getMeasurementState: jest.fn(),
  getMeasurementResults: jest.fn(),
  startMeasurement: jest.fn(),
  setLanguage: jest.fn(),
  setCustomColorTheme: jest.fn(),
  InitializationResult: { OK: 0 },
  MeasurementPreset: { THIRTY_SECONDS_ALL_METRICS: 9 },
}));

import { getHealthRisks } from 'react-native-shenai-sdk';

const validRawResults = {
  heartRateBpm: 72,
  hrvSdnnMs: 45,
  stressIndex: 30,
  breathingRateBpm: 16,
};

describe('saveShenaiResultToFirebase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getHealthRisks as jest.Mock).mockResolvedValue({ wellnessScore: 0.78 });
  });

  it('retorna null sem crashar quando results é null', async () => {
    const result = await saveShenaiResultToFirebase(null);
    expect(result).toBeNull();
  });

  it('retorna ShenaiScanResult com todos os campos numéricos para dados válidos', async () => {
    const result = await saveShenaiResultToFirebase(validRawResults);
    expect(result).not.toBeNull();
    expect(typeof result!.heartRate).toBe('number');
    expect(typeof result!.hrvTotal).toBe('number');
    expect(typeof result!.stressScore).toBe('number');
    expect(typeof result!.respiratoryRate).toBe('number');
    expect(typeof result!.wellnessScore).toBe('number');
    expect(typeof result!.measurementId).toBe('string');
  });

  it('normaliza wellnessScore de 0-1 para 0-100', async () => {
    (getHealthRisks as jest.Mock).mockResolvedValue({ wellnessScore: 0.78 });
    const result = await saveShenaiResultToFirebase(validRawResults);
    expect(result!.wellnessScore).toBe(78);
  });

  it('usa fallback de score calculado se getHealthRisks lançar erro', async () => {
    (getHealthRisks as jest.Mock).mockRejectedValue(new Error('SDK error'));
    const result = await saveShenaiResultToFirebase(validRawResults);
    expect(result).not.toBeNull();
    expect(result!.wellnessScore).toBeGreaterThanOrEqual(0);
    expect(result!.wellnessScore).toBeLessThanOrEqual(100);
  });
});
