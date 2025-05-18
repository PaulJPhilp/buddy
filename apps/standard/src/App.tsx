import { useState } from 'react';
import EnhancedApp from './EnhancedApp';
import { AppShell } from './components/AppShell';
import { ChatApp } from '@buddy/ui';

function App() {
  const [activeView, setActiveView] = useState<'standard' | 'enhanced'>('standard');

  return (
    <div className="h-screen flex flex-col">
      {/* Navigation bar */}
      <nav className="bg-gray-100 p-4 flex space-x-4 shadow-sm">
        <button
          type="button"
          className={`px-4 py-2 rounded ${activeView === 'standard' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveView('standard')}
        >
          Standard Chat
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded ${activeView === 'enhanced' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveView('enhanced')}
        >
          Enhanced Chat (UI Package)
        </button>
      </nav>

      {/* Content */}
      <div className="flex-1">
        {activeView === 'standard' ? (
          <AppShell>
            <ChatApp error={undefined} />
          </AppShell>
        ) : (
          <EnhancedApp />
        )}
      </div>
    </div>
  );
}

export default App;
