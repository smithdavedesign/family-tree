import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { });
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => { });

describe('errorLogger', () => {
    let errorLogger;

    beforeEach(async () => {
        // Reset mocks
        mockConsoleError.mockClear();
        mockConsoleWarn.mockClear();
        mockConsoleLog.mockClear();

        // Import fresh module
        errorLogger = await import('../../utils/errorLogger');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('captureException', () => {
        it('should log error to console', () => {
            const testError = new Error('Test error');
            const context = { userId: '123', action: 'test' };

            errorLogger.captureException(testError, context);

            expect(mockConsoleError).toHaveBeenCalled();
            const logCall = mockConsoleError.mock.calls[0];
            expect(logCall[0]).toContain('[ERROR]');
            expect(logCall[0]).toContain('Test error');
        });

        it('should include context in error log', () => {
            const testError = new Error('Context test');
            const context = {
                userId: 'user-123',
                treeId: 'tree-456',
                action: 'delete'
            };

            errorLogger.captureException(testError, context);

            expect(mockConsoleError).toHaveBeenCalled();
            const logCall = mockConsoleError.mock.calls[0];
            expect(logCall).toContain(context);
        });

        it('should handle errors without context', () => {
            const testError = new Error('No context error');

            errorLogger.captureException(testError);

            expect(mockConsoleError).toHaveBeenCalled();
        });

        it('should handle non-Error objects', () => {
            const errorString = 'String error';

            errorLogger.captureException(errorString, {});

            expect(mockConsoleError).toHaveBeenCalled();
        });

        it('should include stack trace when available', () => {
            const testError = new Error('Stack trace test');
            testError.stack = 'Error: Stack trace test\n    at Object.<anonymous>';

            errorLogger.captureException(testError, {});

            expect(mockConsoleError).toHaveBeenCalled();
        });
    });

    describe('captureMessage', () => {
        it('should log info message to console', () => {
            const message = 'Test info message';
            const context = { level: 'info' };

            errorLogger.captureMessage(message, context);

            expect(mockConsoleLog).toHaveBeenCalled();
            const logCall = mockConsoleLog.mock.calls[0];
            expect(logCall[0]).toContain(message);
        });

        it('should handle warning level messages', () => {
            const message = 'Warning message';
            const context = { level: 'warning' };

            errorLogger.captureMessage(message, context);

            expect(mockConsoleWarn).toHaveBeenCalled();
        });

        it('should include context in message log', () => {
            const message = 'Context message';
            const context = {
                userId: 'test-user',
                component: 'TestComponent'
            };

            errorLogger.captureMessage(message, context);

            expect(mockConsoleLog).toHaveBeenCalled();
            const logCall = mockConsoleLog.mock.calls[0];
            expect(logCall).toContain(context);
        });
    });

    describe('error boundary integration', () => {
        it('should handle React error boundary errors', () => {
            const componentError = new Error('Component render error');
            const errorInfo = {
                componentStack: '\\n    at ComponentThatThrows'
            };

            errorLogger.captureException(componentError, {
                errorInfo,
                location: 'ErrorBoundary'
            });

            expect(mockConsoleError).toHaveBeenCalled();
        });
    });

    describe('environment handling', () => {
        it('should work in development environment', () => {
            const error = new Error('Dev error');

            errorLogger.captureException(error, { env: 'development' });

            expect(mockConsoleError).toHaveBeenCalled();
        });

        it('should work in production environment', () => {
            const error = new Error('Prod error');

            errorLogger.captureException(error, { env: 'production' });

            expect(mockConsoleError).toHaveBeenCalled();
        });
    });
});
