import { ChatApp } from '../src';

// A simple component to test ChatApp in isolation
export default function SimpleTest() {
    return (
        <div className="h-screen w-screen flex flex-col">
            <ChatApp
                error={null}
            />
        </div>
    );
}
