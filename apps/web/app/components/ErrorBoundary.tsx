'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">😵</div>
              <h1 className="text-2xl font-bold mb-4">出错了</h1>
              <p className="text-gray-400 mb-6">
                应用遇到了意外错误，请刷新页面重试
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                刷新页面
              </button>
              {this.state.error && (
                <pre className="mt-6 p-4 bg-gray-800 rounded-lg text-left text-sm text-red-400 overflow-auto">
                  {this.state.error.message}
                </pre>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
