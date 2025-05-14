import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UIBar } from '../UIBar';

describe('UIBar', () => {
    // Test the input variant
    describe('input variant', () => {
        const mockProps = {
            theme: 'blue' as const,
            onPaperclipClickAction: vi.fn(),
            onDashboardClickAction: vi.fn(),
        };

        it('renders paperclip and dashboard buttons', () => {
            render(<UIBar {...mockProps} />);

            expect(screen.getByLabelText('Attach file')).toBeInTheDocument();
            expect(screen.getByLabelText('Open dashboard')).toBeInTheDocument();
        });

        it('calls onPaperclipClickAction when paperclip button is clicked', () => {
            render(<UIBar {...mockProps} />);

            fireEvent.click(screen.getByLabelText('Attach file'));
            expect(mockProps.onPaperclipClickAction).toHaveBeenCalledTimes(1);
        });

        it('calls onDashboardClickAction when dashboard button is clicked', () => {
            render(<UIBar {...mockProps} />);

            fireEvent.click(screen.getByLabelText('Open dashboard'));
            expect(mockProps.onDashboardClickAction).toHaveBeenCalledTimes(1);
        });

        it('applies correct hover styles based on theme', () => {
            const { rerender } = render(<UIBar {...mockProps} />);

            const paperclipBtn = screen.getByLabelText('Attach file');
            expect(paperclipBtn).toHaveClass('hover:bg-teal-50');

            rerender(<UIBar {...mockProps} theme="rose" />);
            expect(paperclipBtn).toHaveClass('hover:bg-orange-50');
        });
    });

    // Test the agent variant
    describe('agent variant', () => {
        const mockAgentProps = {
            theme: 'blue' as const,
            onPaperclipClickAction: vi.fn(),
            onDashboardClickAction: vi.fn(),
            selectedAgent: 'Agent 1',
            agentNames: ['Agent 1', 'Agent 2', 'Agent 3'],
            onAgentChangeAction: vi.fn(),
            variant: 'agent' as const
        };

        it('renders AgentSelector when in agent variant', () => {
            render(<UIBar {...mockAgentProps} />);

            // Check if the agent selector is rendered instead of the buttons
            expect(screen.queryByLabelText('Attach file')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Open dashboard')).not.toBeInTheDocument();

            // This assumes AgentSelector renders the selected agent visibly
            expect(screen.getByText(mockAgentProps.selectedAgent)).toBeInTheDocument();
        });

        it('falls back to input variant when agent props are missing', () => {
            render(
                <UIBar
                    {...mockAgentProps}
                    selectedAgent={undefined}
                    agentNames={undefined}
                    onAgentChangeAction={undefined}
                />
            );

            // Should show buttons instead of agent selector
            expect(screen.getByLabelText('Attach file')).toBeInTheDocument();
            expect(screen.getByLabelText('Open dashboard')).toBeInTheDocument();
        });
    });
});
