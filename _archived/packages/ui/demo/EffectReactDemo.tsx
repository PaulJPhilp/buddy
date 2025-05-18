import { EffectReactTest } from '../src/components/EffectReactTest';

function EffectReactDemo() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Effect-React Integration Demo</h1>
            <p className="mb-4">
                This demo showcases the integration of Effect.js with React using @effect-ts/react.
                It demonstrates state management, side effects, and reactive updates.
            </p>
            <EffectReactTest />
        </div>
    );
}

export default EffectReactDemo;
