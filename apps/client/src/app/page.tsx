import { MinimalChatApp } from "@/app-chat/MinimalChatApp"

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4">
            <div className="w-full max-w-4xl h-[80vh] border rounded-lg shadow-sm">
                <MinimalChatApp />
            </div>
        </main>
    )
} 