import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ScreenErrorBoundary from '../components/ScreenErrorBoundary';

function BrokenComponent(): React.ReactElement {
  throw new Error('render crash simulado');
}

function WorkingComponent() {
  return <></>;
}

// Suprime o console.error do React para erros esperados neste teste
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('ScreenErrorBoundary', () => {
  it('exibe mensagem de erro quando filho crasha — não fica tela preta', () => {
    render(
      <ScreenErrorBoundary>
        <BrokenComponent />
      </ScreenErrorBoundary>
    );
    expect(screen.getByText(/algo deu errado/i)).toBeTruthy();
  });

  it('renderiza filhos normalmente quando não há erro', () => {
    render(
      <ScreenErrorBoundary>
        <WorkingComponent />
      </ScreenErrorBoundary>
    );
    expect(screen.queryByText(/algo deu errado/i)).toBeNull();
  });
});
