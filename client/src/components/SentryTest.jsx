import { useState } from 'react';
import { captureException, captureMessage } from '../utils/sentry';
import { Button } from './ui';

/**
 * Test component for Sentry integration
 * This component provides buttons to test error tracking
 */
export default function SentryTest() {
    const [status, setStatus] = useState('');

    const testFrontendError = () => {
        try {
            throw new Error('Test Sentry Error - Frontend');
        } catch (error) {
            captureException(error, {
                component: 'SentryTest',
                action: 'testFrontendError'
            });
            setStatus('✅ Frontend error sent to Sentry');
        }
    };

    const testFrontendMessage = () => {
        captureMessage('Test Sentry Message - Frontend', 'info', {
            component: 'SentryTest',
            action: 'testFrontendMessage'
        });
        setStatus('✅ Frontend message sent to Sentry');
    };

    const testBackendError = async () => {
        try {
            const response = await fetch('/api/test/sentry-error');
            const data = await response.json();
            setStatus(`✅ Backend error sent: ${data.message}`);
        } catch (error) {
            setStatus(`❌ Failed to test backend: ${error.message}`);
        }
    };

    const testBackendMessage = async () => {
        try {
            const response = await fetch('/api/test/sentry-message');
            const data = await response.json();
            setStatus(`✅ Backend message sent: ${data.message}`);
        } catch (error) {
            setStatus(`❌ Failed to test backend: ${error.message}`);
        }
    };

    const checkHealth = async () => {
        try {
            const response = await fetch('/api/test/health');
            const data = await response.json();
            setStatus(`✅ Health: ${data.status}, Sentry: ${data.sentry}`);
        } catch (error) {
            setStatus(`❌ Health check failed: ${error.message}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Sentry Integration Test</h2>

            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Frontend Tests</h3>
                    <div className="flex gap-2">
                        <Button onClick={testFrontendError} variant="danger">
                            Test Frontend Error
                        </Button>
                        <Button onClick={testFrontendMessage} variant="primary">
                            Test Frontend Message
                        </Button>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Backend Tests</h3>
                    <div className="flex gap-2">
                        <Button onClick={testBackendError} variant="danger">
                            Test Backend Error
                        </Button>
                        <Button onClick={testBackendMessage} variant="primary">
                            Test Backend Message
                        </Button>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Health Check</h3>
                    <Button onClick={checkHealth} variant="secondary">
                        Check API Health
                    </Button>
                </div>

                {status && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                        <p className="font-mono text-sm">{status}</p>
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Set up Sentry DSN in .env files</li>
                        <li>Click test buttons above</li>
                        <li>Check Sentry dashboard at https://sentry.io</li>
                        <li>Verify errors and messages appear in Issues tab</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
