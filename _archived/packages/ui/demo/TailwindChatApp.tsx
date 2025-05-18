import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
// A component that tests our real components but with explicit Tailwind classes
import React from 'react';
import { AttachmentRow } from '../src/components/AttachmentRow';
import { HeaderBar } from '../src/components/HeaderBar';
import { MessageArea } from '../src/components/MessageArea';
import { UserArea } from '../src/components/UserArea';
import '../src/styles/globals.css';

// Create a ChatApp component that explicitly uses Tailwind classes
// to ensure styling works correctly
const TailwindChatApp: React.FC = () => {
    // Create an application runtime instance
    const appRuntime = Effect.runSync(
        Effect.scoped(
            Layer.toRuntime(Layer.empty)
        )
    );

    // Make the runtime available globally for useRuntime hook in child components
    if (typeof window !== "undefined") {
        (window as any).effectTsRuntime = appRuntime;
    }

    // Mock files for testing
    const mockFiles: File[] = [
        new File([new Blob(['test content'])], 'document.pdf', { type: 'application/pdf' }),
        new File([new Blob(['test image'])], 'image.png', { type: 'image/png' }),
    ];

    // Placeholder effect for submitting a message
    const onSubmitMessageEffect = (text: string): Effect.Effect<void, Error> => {
        return Effect.log(`Message: ${text}`).pipe(Effect.asVoid);
    };

    // Effect for removing a file
    const onRemoveFileEffect = (file: File): Effect.Effect<void, Error> => {
        return Effect.succeed(void 0);
    };

    return (
        <div className="flex flex-col h-screen w-full bg-gray-50">
            {/* This div helps verify Tailwind is working */}
            <div className="bg-blue-500 text-white p-2 text-center font-bold">
                Tailwind Test Header - This should be blue with white text
            </div>

            <div className="flex-1 flex flex-col">
                <HeaderBar
                    title="Tailwind Chat Test"
                    className="bg-green-100 border-b border-green-200"
                />

                <div className="flex-1 relative overflow-auto">
                    <MessageArea className="bg-white p-4" />

                    {/* Test section to verify Tailwind classes are working */}
                    <div className="m-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
                        <h2 className="font-bold text-blue-800 mb-2">Tailwind Test Indicators</h2>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-red-500 text-white p-2 rounded">Red Background</div>
                            <div className="bg-blue-500 text-white p-2 rounded">Blue Background</div>
                            <div className="bg-green-500 text-white p-2 rounded">Green Background</div>
                            <div className="bg-purple-500 text-white p-2 rounded">Purple Background</div>
                        </div>

                        {/* Test AttachmentRow directly */}
                        <div className="mt-4 border-t border-blue-200 pt-4">
                            <h3 className="font-semibold text-blue-800 mb-2">AttachmentRow Test</h3>
                            <AttachmentRow
                                attachedFiles={mockFiles}
                                onRemoveFileEffect={onRemoveFileEffect}
                                className="bg-white rounded p-2 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                <UserArea
                    onSubmitMessageEffect={onSubmitMessageEffect}
                    attachedFiles={mockFiles}
                    onRemoveFileEffect={onRemoveFileEffect}
                    error="This is a test error message - styled with Tailwind"
                    onDismissErrorAction={Effect.succeed(void 0)}
                    className="bg-gray-50 border-t border-gray-200"
                />
            </div>
        </div>
    );
};

export default TailwindChatApp;
