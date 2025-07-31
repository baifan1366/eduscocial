'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

// Error boundary class component (cannot use hooks)
class ErrorBoundaryClass extends React.Component {
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
            // Pass error state to the functional component that can use hooks
            return (
                <ErrorFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    resetError={this.resetError}
                />
            );
        }

        return this.props.children;
    }
}

// Functional component that can use hooks for the error UI
function ErrorFallback({ error, errorInfo, resetError }) {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const locale = useLocale();
    const pathname = `/${locale}/business/payments-and-credits/buy-credits`;

    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-red-500">{t('something_went_wrong')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="text-center space-y-4">
                    <p>{t('error_occurred_while_loading_checkout_page')}</p>
                    {process.env.NODE_ENV === 'development' && (
                        <details className="text-left text-sm text-gray-600">
                            <summary>{t('error_details_for_debugging')}</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                {error ? error.toString() : 'No error details available'}
                                {errorInfo && errorInfo.componentStack && (
                                    <>
                                        <br />
                                        {errorInfo.componentStack}
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
                    onClick={resetError}
                >
                    {t('try_again')}
                </Button>
                <Button
                    variant="default"
                    onClick={() => router.push(pathname)}
                >
                    {t('back_to_plans')}
                </Button>
            </CardFooter>
        </Card>
    );
}

// Export the class component as the main error boundary
const CheckoutErrorBoundary = ErrorBoundaryClass;

export default CheckoutErrorBoundary;
