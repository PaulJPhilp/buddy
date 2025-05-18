// Add global type for window.effectTsRuntime
import { Runtime } from "effect";

declare global {
    interface Window {
        effectTsRuntime: Runtime.Runtime<never>;
    }
}
