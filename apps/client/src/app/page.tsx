import { Suspense } from 'react';
import { ClientOnly } from '@/features/chat/components/ClientOnly';
import ChatContainer from './ChatContainer';

export default function Home() {
  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center">Loading...</div>}>
      <ClientOnly>
        <ChatContainer />
      </ClientOnly>
    </Suspense>
  );
}
