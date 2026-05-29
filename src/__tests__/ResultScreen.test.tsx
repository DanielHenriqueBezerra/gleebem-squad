import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ResultScreen from '../screens/ResultScreen';
import { ShenaiScanResult } from '../services/shenai.service';

// Mocks de módulos nativos que não existem no ambiente Jest
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Svg = (props: any) => React.createElement(View, props);
  return {
    __esModule: true,
    default: Svg,
    Circle: (props: any) => React.createElement(View, props),
    Path: (props: any) => React.createElement(View, props),
  };
});

jest.mock('../components/StatusBarRow', () => () => null);
jest.mock('../components/InnerHeader', () => () => null);
jest.mock('../components/CTABar', () => () => null);

function makeNavigation(overrides: Partial<{ navigate: jest.Mock; replace: jest.Mock }> = {}) {
  return {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
    ...overrides,
  } as any;
}

const validResults: ShenaiScanResult = {
  heartRate: 72,
  hrvTotal: 45,
  stressScore: 30,
  respiratoryRate: 16,
  measurementId: 'test-123',
  wellnessScore: 78,
};

// Shape que o fallback offline pode retornar quando o Firebase falha
const fallbackResults: ShenaiScanResult = {
  heartRate: 0,
  hrvTotal: 0,
  stressScore: 0,
  respiratoryRate: 0,
  measurementId: 'offline_scan',
  wellnessScore: 0,
};

describe('ResultScreen', () => {
  it('renderiza o título "Wellness Score" com dados válidos', () => {
    const route = { params: { results: validResults } } as any;
    render(<ResultScreen navigation={makeNavigation()} route={route} />);
    expect(screen.getByText('Wellness Score')).toBeTruthy();
  });

  it('exibe o valor numérico do wellness score com dados válidos', () => {
    const route = { params: { results: validResults } } as any;
    render(<ResultScreen navigation={makeNavigation()} route={route} />);
    expect(screen.getByText('78')).toBeTruthy();
  });

  it('renderiza sem crashar com dados fallback (todos zeros)', () => {
    const route = { params: { results: fallbackResults } } as any;
    expect(() => {
      render(<ResultScreen navigation={makeNavigation()} route={route} />);
    }).not.toThrow();
    expect(screen.getByText('Wellness Score')).toBeTruthy();
  });

  it('exibe as métricas individuais com dados válidos', () => {
    const route = { params: { results: validResults } } as any;
    render(<ResultScreen navigation={makeNavigation()} route={route} />);
    expect(screen.getByText('Freq. Cardíaca')).toBeTruthy();
    expect(screen.getByText('Variab. Cardíaca')).toBeTruthy();
    // "Nível de Estresse" aparece no MetricCard e no gauge — usamos getAllByText
    expect(screen.getAllByText('Nível de Estresse').length).toBeGreaterThan(0);
    expect(screen.getByText('Respiração')).toBeTruthy();
  });
});
