import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import { Button } from '../../components/ui';

describe('Button Component', () => {
    it('should render button with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should handle click events', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<Button onClick={handleClick}>Click me</Button>);

        await user.click(screen.getByText('Click me'));
        expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should render primary variant', () => {
        render(<Button variant="primary">Primary</Button>);
        const button = screen.getByText('Primary');
        // Check for the actual Tailwind class used in the component
        expect(button).toHaveClass('bg-primary-600');
    });

    it('should render danger variant', () => {
        render(<Button variant="danger">Delete</Button>);
        const button = screen.getByText('Delete');
        // Check for the actual Tailwind class used in the component
        expect(button).toHaveClass('bg-error-600');
    });

    it('should be disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByText('Disabled');
        expect(button).toBeDisabled();
    });

    it('should show loading state', () => {
        render(<Button loading>Loading</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });
});
