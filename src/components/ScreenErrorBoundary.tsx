import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme';

interface Props {
  children: React.ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export default class ScreenErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo deu errado</Text>
          <Text style={styles.subtitle}>Não foi possível exibir esta tela.</Text>
          {this.props.onRetry && (
            <TouchableOpacity style={styles.btn} onPress={this.props.onRetry} activeOpacity={0.8}>
              <Text style={styles.btnTxt}>Tentar novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    padding: 32,
  },
  title: { fontWeight: '800', fontSize: 18, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 },
  btn: {
    backgroundColor: Colors.blue,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 99,
  },
  btnTxt: { color: 'white', fontWeight: '800', fontSize: 14 },
});
