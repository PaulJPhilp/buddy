# ChatApp Refactor - Implementation Plan

## 1. Overall Goal

Refactor the existing `ChatApp.tsx` component into three main, more modular components: `Header`, `ChatArea`, and `UserArea`. This will involve creating a reusable `ToolBar` component and establishing a shared, configurable styling system.

## 2. Phase 1: Implement Reusable `ToolBar` Component

- **Objective**: Create a flexible, reusable `ToolBar` component as designed.
- **Location**: `packages/ui/src/components/ToolBar/`
    - `ToolBar.tsx`: Main component logic.
    - `ToolBar.types.ts`: TypeScript interfaces (`ToolBarProps`, `ToolBarItem`, `ToolBarCommand`, `ToolBarSpacer`).
    - `ToolBar.styles.ts`: Definition of `toolbarVariantStyles` objects (containing Tailwind classes for different variants like 'default', 'tiny').
- **Implementation Steps**:
    1.  Define TypeScript interfaces in `ToolBar.types.ts`.
    2.  Create `ToolBar.styles.ts` and define initial style objects for at least a 'default' variant.
    3.  Implement `ToolBar.tsx`:
        - Accept `commands`, `variant`, `className`, `ariaLabel` props.
        - Iterate through `commands` array.
        - Render `ToolBarCommand` items (icon, optional label, action, tooltip, disabled state).
        - Render `ToolBarSpacer` items as flexible divs (`flex-grow`).
        - Handle `null` items as empty slots.
        - Apply styling based on the `variant` prop by looking up classes in `toolbarVariantStyles`.
    4.  Add basic unit tests.
    5.  Export `ToolBar` from `packages/ui/src/components/ui/index.ts`.

## 3. Phase 2: Refactor `ChatApp` into `Header`, `ChatArea`, `UserArea`

- **Objective**: Decompose `ChatApp.tsx` by creating and integrating the new `Header`, `ChatArea`, and `UserArea` components.
- **Directory Structure**: `apps/client/src/features/chat/components/`
    - `Header.tsx`
    - `ChatArea.tsx`
    - `UserArea.tsx`
    - Potentially sub-components (e.g., `AttachmentBar.tsx`, `MinimalInput.tsx` for `UserArea`).
- **Process (Iterative for each new component: `Header`, then `ChatArea`, then `UserArea`):**
    1.  **Define Props**:
        - Finalize the props interface for the component (data inputs, action callbacks, styling props like `primaryColor`, `variant` specific to this component if any).
        - Include props for configuring any `ToolBar` instances it uses (e.g., `headerToolbarCommands: ToolBarItem[]`).
    2.  **Create Component File**: Create the `.tsx` file in the new directory.
    3.  **Basic Structure**: Implement the basic JSX structure.
    4.  **Integrate `ToolBar`**: If the component uses a `ToolBar`, import and instantiate it, passing the necessary `commands` configuration and `variant`.
    5.  **Extract Logic & JSX**: Gradually move relevant functionality, state (if localized), and JSX from the original `ChatApp.tsx` into the new component.
    6.  **Update `ChatApp.tsx`**:
        - Import the newly created component.
        - Render it within `ChatApp.tsx`.
        - Pass down the required props (data, callbacks, styling information).
        - Remove the old code that has been migrated.
    7.  Test the integration.

## 4. Phase 3: Shared Configuration and Styling Management

- **Objective**: Ensure styling is consistent and configurable.
- **Style Variant Definitions**:
    - **Location**:
        - Generic variants (like `toolbarVariantStyles`): `packages/ui/src/styles/` or near the component in `packages/ui`.
        - ChatApp-specific component variants (e.g., `headerVariants`): `apps/client/src/features/chat/styles/`.
    - **Content**: JavaScript/TypeScript objects mapping variant names to collections of Tailwind classes or style attributes.
- **Color Theme Propagation**:
    - Determine the source of truth for `primaryColor`, `secondaryColor`, etc. (likely passed into `ChatApp`).
    - Ensure these are correctly passed down as props to `Header`, `ChatArea`, and `UserArea`, and subsequently to any `ToolBar` instances or other sub-components that need them.
- **Tailwind Configuration**: Ensure `tailwind.config.js` (v4 syntax) in `apps/client` correctly includes all paths where Tailwind classes will be used, including `packages/ui`.

## 5. Future Considerations (Post-Refactor)

- Advanced `ToolBar` layouts (if spacers prove insufficient for some cases).
- More sophisticated state management for `ChatApp` if prop drilling becomes excessive.
- Further breakdown of `Header`, `ChatArea`, `UserArea` if they remain too large.
