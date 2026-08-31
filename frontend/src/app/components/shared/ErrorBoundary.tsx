import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Capture les erreurs de rendu React et affiche un message lisible
 * au lieu d'une page blanche.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{ maxWidth: 640, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
            Une erreur est survenue dans l'interface
          </h1>
          <p style={{ color: '#64748b', marginBottom: 16 }}>
            Détail technique (à communiquer si le problème persiste) :
          </p>
          <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 8, fontSize: 13, whiteSpace: 'pre-wrap', overflowX: 'auto', maxHeight: 260 }}>
            {this.state.error.name}: {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack?.split('\n').slice(0, 8).join('\n')}
          </pre>
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button onClick={() => { this.setState({ error: null }); location.reload(); }}
              style={{ padding: '10px 20px', background: '#FFC107', color: '#1A1A2E', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
              Recharger la page
            </button>
            <button onClick={() => { location.href = '/learn/admin'; }}
              style={{ padding: '10px 20px', background: '#fff', color: '#1A1A2E', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }
}
