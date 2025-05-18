
// Create a minimal debugging component
const DebuggingApp = () => {
    console.log('DebuggingApp is rendering');

    // Just render a simple UI to check if basic React rendering works
    return (
        <div className="flex flex-col h-screen w-full bg-white">
            <div className="border-b border-gray-200 bg-white shadow-sm p-3">
                <h1>Debugging Header</h1>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-auto">
                    <p className="mb-4">This is a debugging component to test rendering.</p>
                </div>

                <div className="p-2">
                    <button
                        type="button"
                        onClick={() => console.log('Button clicked')}
                        className="mb-2 text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                        + Test Button
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DebuggingApp;
