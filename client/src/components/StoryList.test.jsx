import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import StoryList from './StoryList';
import { useStories } from '../hooks/useStories';
import { useToast } from './ui';

// Mock the hooks
vi.mock('../hooks/useStories');
vi.mock('./ui', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
    useToast: vi.fn(),
}));

// Mock StoryEditor
vi.mock('./StoryEditor', () => ({
    default: ({ content, onChange }) => (
        <div data-testid="story-editor">
            <button onClick={() => onChange({ type: 'doc', content: [] })}>Change Content</button>
        </div>
    ),
}));

describe('StoryList', () => {
    const mockToast = { success: vi.fn(), error: vi.fn() };

    beforeEach(() => {
        useToast.mockReturnValue({ toast: mockToast });
    });

    it('renders loading state', () => {
        useStories.mockReturnValue({
            stories: [],
            isLoading: true,
            createStory: vi.fn(),
            updateStory: vi.fn(),
            deleteStory: vi.fn(),
        });

        const { container } = render(<StoryList personId="1" treeId="1" isEditor={true} />);
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders empty state', () => {
        useStories.mockReturnValue({
            stories: [],
            isLoading: false,
            createStory: vi.fn(),
            updateStory: vi.fn(),
            deleteStory: vi.fn(),
        });

        render(<StoryList personId="1" treeId="1" isEditor={false} />);
        expect(screen.getByText(/No stories yet/i)).toBeInTheDocument();
    });

    it('renders list of stories', () => {
        const mockStories = [
            { id: '1', title: 'My First Story', created_at: new Date().toISOString() },
            { id: '2', title: 'Another Tale', created_at: new Date().toISOString() },
        ];

        useStories.mockReturnValue({
            stories: mockStories,
            isLoading: false,
            createStory: vi.fn(),
            updateStory: vi.fn(),
            deleteStory: vi.fn(),
        });

        render(<StoryList personId="1" treeId="1" isEditor={true} />);

        expect(screen.getByText('My First Story')).toBeInTheDocument();
        expect(screen.getByText('Another Tale')).toBeInTheDocument();
    });

    it('shows editor when create button is clicked', () => {
        useStories.mockReturnValue({
            stories: [],
            isLoading: false,
            createStory: vi.fn(),
            updateStory: vi.fn(),
            deleteStory: vi.fn(),
        });

        render(<StoryList personId="1" treeId="1" isEditor={true} />);

        const addButton = screen.getAllByRole('button')[0]; // Plus button
        fireEvent.click(addButton);

        expect(screen.getByText('New Story')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Story Title')).toBeInTheDocument();
    });
});
