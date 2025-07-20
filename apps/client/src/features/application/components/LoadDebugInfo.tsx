import { Effect } from "effect";
import React, { useEffect, useRef, useState } from "react";
import { useEffectContext } from "../EffectProvider";
import { AppComponent } from "./service";

export function LoadDebugInfo() {
  const { runWithServices } = useEffectContext();
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [workspaceCount, setWorkspaceCount] = useState<number>(0);
  const [chatAppCount, setChatAppCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Add visibility state
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let didSet = false;

    runWithServices(
      Effect.gen(function* () {
        const appComponent = yield* AppComponent;
        // Subscribe to state changes
        unsub = yield* appComponent.subscribe((state) => {
          if (state.isConfigLoaded && !didSet) {
            didSet = true;
            setWorkspaceCount(state.appConfig?.workspaces?.length || 0);
            setChatAppCount(state.appConfig?.chatapps?.length || 0);
            setLoadTime(Date.now() - startTimeRef.current);
            setIsLoaded(true);
          }
        });
      }),
    );

    return () => {
      if (unsub) unsub();
    };
  }, [runWithServices]);

  if (!isLoaded || loadTime === null || !isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 8,
        zIndex: 10000,
        fontSize: 14,
        minWidth: 220,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <button
        aria-label="Dismiss debug info"
        onClick={() => setIsVisible(false)}
        style={{
          position: "absolute",
          top: 6,
          right: 10,
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: 18,
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <div style={{ paddingTop: 8 }}>
        ⏱️ Load Time: <b>{(loadTime / 1000).toFixed(2)}s</b>
      </div>
      <div>
        💼 Workspaces Loaded: <b>{workspaceCount}</b>
      </div>
      <div>
        💬 Chat Apps Loaded: <b>{chatAppCount}</b>
      </div>
    </div>
  );
}
