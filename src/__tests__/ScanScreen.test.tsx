import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import ScanScreen from '../screens/ScanScreen';

const mockScanResult = {
  heartRate: 72,
  hrvTotal: 45,
  stressScore: 30,
  respiratoryRate: 16,
  measurementId: 'test-123',
  wellnessScore: 78,
};

// Mock do serviço Shen.ai
jest.mock('../services/shenai.service', () => ({
  executeWellnessScan: jest.fn(),
}));

// Mock do ShenaiSdkView — componente nativo que não existe no Jest
jest.mock('react-native-shenai-sdk', () => ({
  ShenaiSdkView: 'ShenaiSdkView',
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => React.createElement(View, props),
    Path: (props: any) => React.createElement(View, props),
  };
});

import { executeWellnessScan } from '../services/shenai.service';

describe('ScanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navega para Loading após scan bem-sucedido', async () => {
    (executeWellnessScan as jest.Mock).mockResolvedValue(mockScanResult);
    const navigation = { replace: jest.fn(), goBack: jest.fn() } as any;

    render(<ScanScreen navigation={navigation} />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(navigation.replace).toHaveBeenCalledWith('Loading', { results: mockScanResult });
  });

  it('desmonta ShenaiSdkView antes de navegar (previne overlay preto)', async () => {
    (executeWellnessScan as jest.Mock).mockResolvedValue(mockScanResult);
    const navigation = { replace: jest.fn(), goBack: jest.fn() } as any;

    const { UNSAFE_queryByType } = render(<ScanScreen navigation={navigation} />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Após scan concluído: navigation.replace chamado E ShenaiSdkView desmontada
    expect(navigation.replace).toHaveBeenCalledWith('Loading', { results: mockScanResult });
    // ShenaiSdkView não deve mais estar no tree quando navigation.replace é chamado
    const sdkView = UNSAFE_queryByType('ShenaiSdkView' as any);
    expect(sdkView).toBeNull();
  });

  it('não navega se o scan retornar null', async () => {
    (executeWellnessScan as jest.Mock).mockResolvedValue(null);
    const navigation = { replace: jest.fn(), goBack: jest.fn() } as any;

    render(<ScanScreen navigation={navigation} />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
