import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import SearchBar from '../../components/SearchBar';

const mockPersons = [
    {
        id: 'person-1',
        first_name: 'John',
        last_name: 'Doe',
        dob: '1980-01-01',
        dod: null,
        occupation: 'Engineer',
        pob: 'New York'
    },
    {
        id: 'person-2',
        first_name: 'Jane',
        last_name: 'Smith',
        dob: '1985-05-15',
        dod: null,
        occupation: 'Doctor',
        pob: 'Boston'
    },
    {
        id: 'person-3',
        first_name: 'Bob',
        last_name: 'Johnson',
        dob: '1975-12-20',
        dod: '2020-06-10',
        occupation: 'Teacher',
        pob: 'Chicago'
    }
];

describe('SearchBar Component', () => {
    it('should render search input', () => {
        const onHighlight = vi.fn();
        const onClear = vi.fn();

        render(
            <SearchBar
                persons={mockPersons}
                onHighlight={onHighlight}
                onClear={onClear}
            />
        );

        expect(screen.getByPlaceholderText(/search family members/i)).toBeInTheDocument();
    });

    it('should search by name', async () => {
        const onHighlight = vi.fn();
        const onClear = vi.fn();
        const user = userEvent.setup();

        render(
            <SearchBar
                persons={mockPersons}
                onHighlight={onHighlight}
                onClear={onClear}
            />
        );

        const searchInput = screen.getByPlaceholderText(/search family members/i);
        await user.type(searchInput, 'John');

        await waitFor(() => {
            expect(onHighlight).toHaveBeenCalled();
            const highlightedIds = onHighlight.mock.calls[onHighlight.mock.calls.length - 1][0];
            expect(highlightedIds).toContain('person-1');
            expect(highlightedIds).not.toContain('person-2');
        });
    });

    it('should clear search results', async () => {
        const onHighlight = vi.fn();
        const onClear = vi.fn();
        const user = userEvent.setup();

        render(
            <SearchBar
                persons={mockPersons}
                onHighlight={onHighlight}
                onClear={onClear}
            />
        );

        const searchInput = screen.getByPlaceholderText(/search family members/i);
        await user.type(searchInput, 'John');

        // Clear button should appear
        await waitFor(() => {
            const clearButton = screen.getByRole('button', { name: /clear/i });
            expect(clearButton).toBeInTheDocument();
        });
    });

    it('should call onClear when search is cleared', async () => {
        const onHighlight = vi.fn();
        const onClear = vi.fn();

        render(
            <SearchBar
                persons={mockPersons}
                onHighlight={onHighlight}
                onClear={onClear}
            />
        );

        // Initially onClear should be called for empty search
        expect(onClear).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', async () => {
        const onHighlight = vi.fn();
        const onClear = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();

        render(
            <SearchBar
                persons={mockPersons}
                onHighlight={onHighlight}
                onClear={onClear}
                onClose={onClose}
            />
        );

        const closeButton = screen.getByTitle(/close search/i);
        await user.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    it('should search by occupation', async () => {
        const onHighlight = vi.fn();
        const onClear = vi.fn();
        const user = userEvent.setup();

        render(
            <SearchBar
                persons={mockPersons}
                onHighlight={onHighlight}
                onClear={onClear}
            />
        );

        const searchInput = screen.getByPlaceholderText(/search family members/i);
        await user.type(searchInput, 'Engineer');

        await waitFor(() => {
            expect(onHighlight).toHaveBeenCalled();
            const highlightedIds = onHighlight.mock.calls[onHighlight.mock.calls.length - 1][0];
            expect(highlightedIds).toContain('person-1');
        });
    });
});
