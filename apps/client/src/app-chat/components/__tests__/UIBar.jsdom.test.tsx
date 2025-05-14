import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { UIBar } from '../UIBar';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = {
    userAgent: 'node.js',
} as Navigator;

// Setup requestAnimationFrame
global.window.requestAnimationFrame = callback => {
    return setTimeout(() => callback(Date.now()), 0);
};

global.window.cancelAnimationFrame = id => {
    clearTimeout(id);
};

describe('UIBar', () => {
    // Input variant tests
    test('input variant shows buttons', () => {
        const onPaperclipClick = () => { };
        const onDashboardClick = () => { };

        render(
            <UIBar
                theme="blue"
                onPaperclipClickAction={onPaperclipClick}
                onDashboardClickAction={onDashboardClick}
            />
        );

        expect(screen.getByLabelText('Attach file')).toBeDefined();
        expect(screen.getByLabelText('Open dashboard')).toBeDefined();
    });

    // Agent variant tests
    test('agent variant shows selector', () => {
        const mockProps = {
            theme: 'blue',
            onPaperclipClickAction: () => { },
            onDashboardClickAction: () => { },
            selectedAgent: 'Agent 1',
            agentNames: ['Agent 1', 'Agent 2'],
            onAgentChangeAction: () => { },
            variant: 'agent' as const
        };

        render(<UIBar {...mockProps} />);

        // Should not show the input variant buttons
        expect(screen.queryByLabelText('Attach file')).toBeNull();
        expect(screen.queryByLabelText('Open dashboard')).toBeNull();

        // Should show the agent selector
        expect(screen.getByRole('combobox')).toBeDefined();
        expect(screen.getByText('Agent 1')).toBeDefined();
    });

    afterEach(() => {
        cleanup();
    });
});
