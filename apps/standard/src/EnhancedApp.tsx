import { Effect } from 'effect';
import { ChatApp } from '@buddy/ui'; // Import from our packages/ui library
import { AppShell } from './components/AppShell'; // Import from local components

export default function EnhancedApp() {
    // You could use context, props, or any other mechanism to customize the app

    return (
        <AppShell>
            {/* Using the ChatApp from the UI package */}
            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-2xl h-full border-2 border-gray-200">
                    <ChatApp
                        error={null}
                        onDismissErrorAction={Effect.succeed(() => console.log("Dismissed error"))}
                        onCloseAction={Effect.succeed(() => console.log("Closed chat"))}
                    />
                </div>
            </div>
        </AppShell>
    );
}
