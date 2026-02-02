import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class BootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[BOOT ERROR]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#e74c3c', color: 'white', textAlign: 'center', height: '100vh', overflow: 'auto' }}>
          <h1 style={{ fontSize: '1.5rem' }}>SYSTEM BOOT ERROR</h1>
          <p style={{ fontSize: '0.9rem' }}>A critical JavaScript error prevented the game from starting.</p>
          <pre style={{ background: '#000', padding: '10px', textAlign: 'left', overflow: 'auto', fontSize: '0.7rem', maxHeight: '60vh', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.toString()}
            {'\n\nStack:\n'}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer', fontSize: '1rem' }}>RELOAD</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BootErrorBoundary>
      <App />
    </BootErrorBoundary>
  </StrictMode>,
)
