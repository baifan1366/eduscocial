'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

class CheckoutErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('CheckoutErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo || {}
        });
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Card className="w-full h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-red-500">Something went wrong</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="text-center space-y-4">
                            <p>An error occurred while loading the checkout page.</p>
                            {process.env.NODE_ENV === 'development' && (
                                <details className="text-left text-sm text-gray-600">
                                    <summary>Error details (for debugging)</summary>
                                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                        {this.state.error ? this.state.error.toString() : 'No error details available'}
                                        {this.state.errorInfo && this.state.errorInfo.componentStack && (
                                            <>
                                                <br />
                                                {this.state.errorInfo.componentStack}
                                            </>
                                        )}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={this.resetError}
                        >
                            Try Again
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => window.location.href = '/business/payments-and-credits/buy-credits'}
                        >
                            Back to Plans
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default CheckoutErrorBoundary;
