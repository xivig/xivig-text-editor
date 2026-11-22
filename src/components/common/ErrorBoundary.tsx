import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Xivig ErrorBoundary] Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#17191f',
            color: '#e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              backgroundColor: '#1d2028',
              border: '1px solid #ef6464',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '650px',
              width: '100%',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <h2 style={{ margin: '0 0 12px 0', color: '#ef6464', fontSize: '18px' }}>
              Something went wrong loading Xivig Editor
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#9299a8' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            {this.state.errorInfo?.componentStack && (
              <pre
                style={{
                  backgroundColor: '#13151a',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#e6ad45',
                  overflowX: 'auto',
                  maxHeight: '180px',
                  margin: '0 0 16px 0',
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#6c8cff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload Editor
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
