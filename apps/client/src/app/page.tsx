import { ChatApp } from "@/app-chat/ChatApp";

export default function Home() {
  return (
    <>
      <ChatApp threadId="thread1" />
      <ChatApp threadId="thread2" />
    </>
  );
}
