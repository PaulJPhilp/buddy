"use client";

import ChatContainer from "@/app/ChatContainer";
import { useEffect, useState } from "react";

export default function TestChatInstancePage() {
    const [chatIds, setChatIds] = useState({
        business: "",
        social: ""
    });

    // Generate chat IDs on client side to prevent hydration mismatch
    useEffect(() => {
        const timestamp = Date.now();
        setChatIds({
            business: `business-chat-${timestamp}`,
            social: `social-chat-${timestamp}`
        });
    }, []);

    // Don't render chat components until we have client-side IDs for business/social
    if (!chatIds.business || !chatIds.social) {
        return (
            <div className="min-h-screen bg-gray-100 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-4 w-full" />
                        <div className="h-96 bg-gray-200 rounded w-full mt-4" />
                        <div className="h-96 bg-gray-200 rounded w-full mt-4" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 pt-1 px-4 pb-4">
            <div className="max-w-6xl mx-auto">
                <div className="mt-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: "400px" }}>
                            <ChatContainer chatType="business" theme="spike-dark" />
                        </div>

                        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: "400px" }}>
                            <ChatContainer chatType="social" theme="minimal-test" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 