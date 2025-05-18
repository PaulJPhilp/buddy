
interface SidebarProps {
    isOpen: boolean;
    onToggleAction: () => void;
}

export function Sidebar({ isOpen, onToggleAction }: SidebarProps) {
    if (!isOpen) return null;

    return (
        <div className="flex-1 overflow-hidden hover:overflow-y-auto flex flex-col">
            {/* Recent Chats Section */}
            <div className="p-3 border-b">
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Recent Chats</h2>
                <div className="space-y-1">
                    {/* Example chat items - replace with dynamic data */}
                    {['General Chat', 'Project Ideas', 'Technical Support'].map((chat, index) => (
                        <button
                            type="button"
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            key={index}
                            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            {chat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Settings & Help Section */}
            <div className="p-3 mt-auto border-t">
                <div className="space-y-1">
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
                        Settings
                    </button>
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
                        Help & Support
                    </button>
                </div>
            </div>
        </div>
    );
}
