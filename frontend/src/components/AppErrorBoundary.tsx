import React from 'react';

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AZAAM page failed to render', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
        <div role="alert" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold">This page could not load</h1>
          <p className="mt-2 text-sm">Please reload the page to try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white">Reload page</button>
        </div>
      </div>
    );
  }
}
