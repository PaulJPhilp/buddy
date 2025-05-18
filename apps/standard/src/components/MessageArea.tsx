
interface MessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface MessageAreaProps {
  messages: MessageProps[];
  isLoading?: boolean;
}

export function MessageArea({ messages = [], isLoading = false }: MessageAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {isLoading ? (
        <div className="p-2 bg-gray-100 rounded-md text-sm text-gray-600">
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="p-2 bg-gray-50 rounded-md text-sm text-gray-500">
          No messages yet. Start a conversation.
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}
            className={`p-2 rounded-md max-w-[85%] ${
              message.isUser
                ? "bg-blue-50 ml-auto border border-blue-100"
                : "bg-gray-50 border border-gray-100"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
