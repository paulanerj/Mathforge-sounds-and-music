────────────────────────────────────────────────────────────────────────────────
import React, { Component, ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CombineGrid Crash:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRestart = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: '#F5E6D3',
          color: '#5D4037',
          fontFamily: 'Nunito, sans-serif',
          textAlign: 'center',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '16px' }}>
            Game encountered an error
          </h1>
          
          <div style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            textAlign: 'left',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: '14px'
          }}>
            <p style={{ fontWeight: 800, marginBottom: '8px', color: '#D67A7A' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontSize: '10px',
              opacity: 0.7,
              maxHeight: '200px',
              overflowY: 'auto',
              fontFamily: 'monospace'
            }}>
              {this.state.error?.stack}
              {"\n\nComponent Stack:\n"}
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>

          <button
            onClick={this.handleRestart}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: '#D67A7A',
              color: '#fff',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #B65A5A',
              fontSize: '18px'
            }}
          >
            RESTART GAME
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
────────────────────────────────────────────────────────────────────────────────
