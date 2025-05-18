import { Effect } from 'effect';
import { useEffect, useState } from 'react';
import { ChatApp } from '../src';
import { UIBarElementConfig } from '../src/components/UIBar';
import EffectReactDemo from './EffectReactDemo';

export default function App() {
    const [showError, setShowError] = useState(true);
    const [activeView, setActiveView] = useState<'chat' | 'effect-demo'>('chat');
    const [mockFiles, setMockFiles] = useState<File[]>([]);

    // Create some mock files for testing
    useEffect(() => {
        // Create mock files using the Blob API
        const file1 = new File([new Blob(['test content'])], 'document.pdf', { type: 'application/pdf' });
        const file2 = new File([new Blob(['test image'])], 'image.png', { type: 'image/png' });
        const file3 = new File([new Blob(['test spreadsheet'])], 'data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        setMockFiles([file1, file2, file3]);
    }, []);

    // Sample UIBar elements for testing
    const testUIBarElements: UIBarElementConfig[] = [
        {
            type: "iconCommand",
            iconName: "settings",
            label: "Settings",
            effect: Effect.sync(() => {
                console.log("Settings clicked!");
            }),
            tooltip: "Open settings",
            id: "settings"
        },
        {
            type: "selector",
            items: [
                { value: "en", label: "English" },
                { value: "es", label: "Spanish" },
                { value: "fr", label: "French" }
            ],
            currentValue: "en",
            onValueChangeEffect: (selectedValue) => Effect.sync(() => {
                console.log("Language changed to:", selectedValue);
            }),
            placeholder: "Select Language",
            id: "lang-selector"
        },
        {
            type: "iconCommand",
            iconName: "help",
            effect: Effect.sync(() => {
                console.log("Help clicked!");
            }),
            tooltip: "Get help",
            id: "help"
        }
    ];

    // Test error state
    const testError = showError ? "This is a test error message. Click the X to dismiss it!" : null;
    const testDismissError = Effect.sync(() => {
        console.log("Error dismissed!");
        setShowError(false);
    });
    const testCloseAction = Effect.sync(() => {
        console.log("Chat closed!");
        alert("Chat would close here in production");
    });

    return (
        <div className="h-screen w-screen flex flex-col bg-background text-foreground">
            {/* Navigation */}
            <nav className="bg-gray-100 p-4 flex space-x-4">
                <button
                    type="button"
                    className={`px-4 py-2 rounded ${activeView === 'chat' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveView('chat')}
                >
                    ChatApp Demo
                </button>
                <button
                    type="button"
                    className={`px-4 py-2 rounded ${activeView === 'effect-demo' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveView('effect-demo')}
                >
                    Effect React Demo
                </button>
            </nav>

            {/* Content */}
            <div className="flex-1">
                {activeView === 'chat' ? (
                    <div className="border-2 border-orange-500">
                        <ChatApp
                            error={testError}
                            onDismissErrorAction={testDismissError}
                            onCloseAction={testCloseAction}
                            uiBarElements={testUIBarElements}
                            initialAttachedFiles={mockFiles.length > 0 ? mockFiles : undefined}
                        />
                    </div>
                ) : (
                    <EffectReactDemo />
                )}
            </div>
        </div>
    );
}