import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', backgroundColor: '#fee', color: '#900', height: '100vh', overflow: 'auto' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Something went wrong.</h2>
                    <p style={{ marginTop: '10px', fontSize: '18px' }}>{this.state.error && this.state.error.toString()}</p>
                    <pre style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fdd', borderRadius: '5px' }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
