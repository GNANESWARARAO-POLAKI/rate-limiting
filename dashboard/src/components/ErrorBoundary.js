import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full space-y-8 p-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-red-600 mb-4">
                                ⚠️ Something went wrong
                            </h2>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-red-700 mb-2">
                                    <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="text-xs text-red-600">
                                        <summary className="cursor-pointer">Show details</summary>
                                        <pre className="mt-2 whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                🔄 Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
