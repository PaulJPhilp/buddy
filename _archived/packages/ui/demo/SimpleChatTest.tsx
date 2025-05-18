import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
// A minimal test harness for ChatApp component
import React from 'react';
import '../src/styles/globals.css'; // Make sure to import CSS directly

// Import individual components instead of through index
import { HeaderBar } from '../src/components/HeaderBar';
import { MessageArea } from '../src/components/MessageArea';
import { UserArea } from '../src/components/UserArea';

const SimpleChatTest: React.FC = () => {
    // Create a proper Effect runtime using the Layer API
    const appRuntime = Effect.runSync(
        Effect.scoped(Layer.toRuntime(Layer.empty))
    )

    // Make runtime available globally
    if (typeof window !== 'undefined') {
        (window as any).effectTsRuntime = appRuntime;
    }

    // Dummy message submission handler
    const onSubmitMessageEffect = (text: string): Effect.Effect<void, Error> => {
        return Effect.log(`Message received: ${text}`).pipe(Effect.asVoid);
    };

    return (
        <div className="w-full h-screen bg-slate-100 flex flex-col">
            {/* Add explicit styles to verify Tailwind is working */}
            <div className="bg-blue-500 text-white p-4">
                <h1 className="text-xl font-bold">Simple Chat Test - With Explicit Tailwind</h1>
            </div>

            <div className="flex-1 flex flex-col">
                <HeaderBar title="Test Chat Header" />
                <div className="flex-1 overflow-auto bg-white">
                    <MessageArea />
                </div>
                <UserArea
                    onSubmitMessageEffect={onSubmitMessageEffect}
                />
            </div>
        </div>
    );
};

export default SimpleChatTest;
