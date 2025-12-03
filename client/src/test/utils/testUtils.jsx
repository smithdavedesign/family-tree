import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/ui';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Additional render options
 * @returns {Object} - Render result from @testing-library/react
 */
export function renderWithProviders(ui, options = {}) {
    function Wrapper({ children }) {
        return (
            <BrowserRouter>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </BrowserRouter>
        );
    }

    return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
