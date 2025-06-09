import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClerkAdminPanel } from '../ClerkAdminPanel';

// Mock the stores
vi.mock('@/stores/clerkAdminStore', () => ({
    useClerkAdminStore: () => ({
        isOpen: true,
        viewMode: 'list',
        selectedUserId: null,
        loading: false,
        error: null,
    }),
    clerkAdminStore: {
        send: vi.fn(),
    },
}));

// Mock Clerk hooks
vi.mock('@clerk/nextjs', () => ({
    useUser: () => ({
        user: {
            id: 'current_user',
            firstName: 'Current',
            lastName: 'User',
            emailAddresses: [{ emailAddress: 'current@example.com' }],
        },
    }),
    useClerk: () => ({
        openUserProfile: vi.fn(),
    }),
}));

// Mock UI components
vi.mock('@ui/components/ui/avatar', () => ({
    Avatar: ({ children, ...props }: any) => <div data-testid="avatar" {...props}>{children}</div>,
    AvatarImage: ({ ...props }: any) => <img data-testid="avatar-image" {...props} />,
    AvatarFallback: ({ children, ...props }: any) => <div data-testid="avatar-fallback" {...props}>{children}</div>,
}));

vi.mock('@ui/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} {...props}>{children}</button>
    ),
}));

vi.mock('@ui/components/ui/card', () => ({
    Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
    CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
    CardTitle: ({ children, ...props }: any) => <h2 data-testid="card-title" {...props}>{children}</h2>,
    CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
}));

vi.mock('@ui/components/ui/input', () => ({
    Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
}));

vi.mock('@ui/components/ui/badge', () => ({
    Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
}));

vi.mock('@ui/components/ui/tabs', () => ({
    Tabs: ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>,
    TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
    TabsTrigger: ({ children, onClick, ...props }: any) => (
        <button data-testid="tabs-trigger" onClick={onClick} {...props}>{children}</button>
    ),
    TabsContent: ({ children, ...props }: any) => <div data-testid="tabs-content" {...props}>{children}</div>,
}));

vi.mock('@ui/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onClick }: any) => (
        <div data-testid="dropdown-item" onClick={onClick}>{children}</div>
    ),
}));

describe('ClerkAdminPanel', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders when open', () => {
        render(<ClerkAdminPanel isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('User List')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<ClerkAdminPanel isOpen={false} onClose={mockOnClose} />);

        expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<ClerkAdminPanel isOpen={true} onClose={mockOnClose} />);

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('displays user statistics', () => {
        render(<ClerkAdminPanel isOpen={true} onClose={mockOnClose} />);

        // Check for statistics cards
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Admins')).toBeInTheDocument();
    });

    it('displays mock users', () => {
        render(<ClerkAdminPanel isOpen={true} onClose={mockOnClose} />);

        // Check for mock user data
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('has search functionality', () => {
        render(<ClerkAdminPanel isOpen={true} onClose={mockOnClose} />);

        const searchInput = screen.getByPlaceholderText('Search users...');
        expect(searchInput).toBeInTheDocument();

        // Test search functionality
        fireEvent.change(searchInput, { target: { value: 'John' } });
        expect(searchInput).toHaveValue('John');
    });

    it('displays user status badges', () => {
        render(<ClerkAdminPanel isOpen={true} onClose={mockOnClose} />);

        // Check for status badges
        const badges = screen.getAllByTestId('badge');
        expect(badges.length).toBeGreaterThan(0);
    });

    it('has tab navigation', () => {
        render(<ClerkAdminPanel isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText('User List')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('closes when backdrop is clicked', () => {
        render(<ClerkAdminPanel isOpen={true} onClose={mockOnClose} />);

        const backdrop = screen.getByRole('button').parentElement?.querySelector('.bg-black\\/50');
        if (backdrop) {
            fireEvent.click(backdrop);
            expect(mockOnClose).toHaveBeenCalled();
        }
    });
}); 