import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, jest } from 'bun:test';
import { UIBar } from '../UIBar';

describe('UIBar', () => {
    // Test the input variant
    describe('input variant', () => {
        const mockProps = {
            theme: 'blue' as const,
            onPaperclipClickAction: jest.fn(),
            onDashboardClickAction: jest.fn(),
        };

        it('renders paperclip and dashboard buttons', () => {
            render(<UIBar {...mockProps} />);

            expect(screen.getByLabelText('Attach file')).toBeTruthy();
            expect(screen.getByLabelText('Open dashboard')).toBeTruthy();
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
    });

    // Test the agent variant
    describe('agent variant', () => {
        const mockAgentProps = {
            theme: 'blue' as const,
            onPaperclipClickAction: jest.fn(),
            onDashboardClickAction: jest.fn(),
            selectedAgent: 'Agent 1',
            agentNames: ['Agent 1', 'Agent 2', 'Agent 3'],
            onAgentChangeAction: jest.fn(),
            variant: 'agent' as const
        };

        it('renders AgentSelector when in agent variant', () => {
            render(<UIBar {...mockAgentProps} />);

            // We should not see the input variant buttons
            expect(screen.queryByLabelText('Attach file')).toBeNull();
            expect(screen.queryByLabelText('Open dashboard')).toBeNull();

            // We should see the selected agent
            expect(screen.getByText('Agent 1')).toBeTruthy();
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
            expect(screen.getByLabelText('Attach file')).toBeTruthy();
            expect(screen.getByLabelText('Open dashboard')).toBeTruthy();
        });
    });
});
