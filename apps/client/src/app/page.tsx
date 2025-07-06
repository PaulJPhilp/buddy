"use client";

import { EffectProvider } from "@/components/EffectProvider";
import { AppContainer } from "@/components/app";

export default function Page() {
  return (
    <EffectProvider>
      <AppContainer
        config={{
          id: "main-app",
          name: "Buddy Chat App",
          configPath: "/configs/index.json",
          autoLoadConfig: true,
          autoRenderShell: true,
          debugMode: process.env.NODE_ENV === "development",
        }}
        onStateChange={(appState) => {
          console.log("[Page] App state changed:", appState);
        }}
        onConfigLoaded={(config) => {
          console.log("[Page] Config loaded:", config);
        }}
      >
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Buddy Chat App</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Modern AI Chat Platform with Effect Architecture
            </p>
            <div className="space-y-2 text-sm">
              <p>✅ AppContainer (Effect service wrapper)</p>
              <p>✅ ConfigService (Effect-based configuration)</p>
              <p>✅ Clean architecture (no legacy dependencies)</p>
            </div>
          </div>
        </div>
      </AppContainer>
    </EffectProvider>
  );
}
