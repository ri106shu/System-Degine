import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In place of a real error-reporting service for now — at minimum this
    // keeps the failure visible in devtools instead of silently vanishing.
    console.error('Uncaught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-base)] px-4 text-center">
          <p className="text-2xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            Something went wrong
          </p>
          <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
            This page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="mt-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            Back home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
