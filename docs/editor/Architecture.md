# Architecture Document

## Title: Effect Schema to React Form Editor - Architecture

### 1. High-Level Overview
The system's core function is to transform an `Effect.Schema` definition into an interactive React-based form editor. This is achieved by first introspecting the schema's inherent Abstract Syntax Tree (AST) to derive a generalized, UI-agnostic `FormFieldDescription` data structure. This structured description then serves as the blueprint for dynamically rendering a hierarchy of React components, resulting in a fully editable form.

### 2. Core Modules/Components & Their Responsibilities

#### 2.1. `effectSchemaToFormDescription` Module (The "Introspection Layer")
*   **Location:** `src/schema-to-form-description/index.ts` (or similar, along with `types.ts` for data definitions).
*   **Responsibility:**
    *   **Input:** Accepts an `Effect.Schema` object.
    *   **Introspection:** Introspects and recursively traverses the schema's internal Abstract Syntax Tree (AST) or its programmatic structure. This involves analyzing the constructs used (e.g., `S.struct`, `S.array`, `S.union`, `S.string`, `S.number`, `S.boolean`, `S.literal`, `S.enum`).
    *   **Information Extraction:** Extracts crucial type information and properties for each field within the schema.
    *   **`isRequired` Determination:** Logic to determine if a field is required based on its schema definition (e.g., absence of `S.optional` or `S.nullable`).
    *   **Format Detection:** Identifies specific string formats (e.g., `email`, `url`) through chained schema operations (e.g., `S.string.pipe(S.url())`) or custom branding, and sets corresponding `format` properties in the description. Special logic will be included to detect the `CSS_COLOR_NAME | RGB` union and flag it appropriately.
    *   **Normalization:** Transforms the raw schema information into a standardized, UI-friendly `FormFieldDescription` data structure, abstracting away `Effect.Schema`'s internal complexities.
    *   **ID Generation:** Generates unique `id`s for each field description, essential for React's reconciliation process and keying lists.
*   **Output:** A `FormFieldDescription` object, representing the complete structure of the form.

#### 2.2. React UI Components (The "Rendering Layer")
*   **Location:** `src/components/` (and its subdirectories like `src/components/inputs/`).

    *   **2.2.1. `DynamicForm` (Root Component)**
        *   **Location:** `src/components/DynamicForm.tsx`
        *   **Responsibility:**
            *   **Input:** Receives the root `FormFieldDescription` (which must describe an object schema) and initial data for the form.
            *   **State Management:** Manages the overall form data state (`formData`) using React's `useState`.
            *   **State Propagation:** Provides a centralized `onValueChange` handler to its children that immutably updates nested properties within the `formData` state based on the field's path.
            *   **Initial Rendering:** Iterates through the top-level children of the root `FormFieldDescription` and renders a `FormField` component for each.
            *   **Form Submission:** Handles the form's `onSubmit` event, typically invoking an `onSave` callback prop.

    *   **2.2.2. `FormField` (Recursive Dispatcher)**
        *   **Location:** `src/components/FormField.tsx`
        *   **Responsibility:**
            *   **Input:** Receives a single `FormFieldDescription` for a specific field, its `currentValue` from the form state, an `onValueChange` callback, and its full `path` within the data object.
            *   **Type Dispatching:** Acts as a central dispatcher. It uses a `switch` statement (or a dynamically constructed component map) based on the `fieldDescription.type` property to select and render the appropriate concrete input component (e.g., `StringInput`, `ObjectGroup`, `ArrayEditor`).
            *   **Prop Forwarding:** Passes down relevant props (e.g., `label`, `value`, `onChange`, `description`, `isRequired`, type-specific formats/options) to the selected concrete input component.

    *   **2.2.3. Specific Input Components (Concrete Renderers)**
        *   **Location:** `src/components/inputs/` (e.g., `StringInput.tsx`, `NumberInput.tsx`, `BooleanInput.tsx`, `EnumInput.tsx`, `LiteralDisplay.tsx`, `ObjectGroup.tsx`, `ArrayEditor.tsx`, `UnionInput.tsx`).
        *   **Responsibility:**
            *   Each component is a "dumb" (presentational) React component.
            *   It is responsible for rendering the actual HTML input elements (e.g., `<input>`, `<textarea>`, `<select>`) or composing more complex UI structures (e.g., for objects and arrays) corresponding to its specific `FormFieldDescription` type or format.
            *   Receives `value` and `onChange` props from its parent (`FormField` or `ObjectGroup`/`ArrayEditor`).
            *   Typically manages its own internal input state for controlled components before calling the `onChange` handler to propagate updates up to the `DynamicForm`.
            *   `ObjectGroup`: Renders a container (e.g., `fieldset`) and recursively renders `FormField` components for each of its `childrenFields`, ensuring proper `path` and `onChange` propagation.
            *   `ArrayEditor`: Manages the UI for adding new items to an array, removing existing ones, and mapping over the `currentArray` to render `FormField` components for each array item.
            *   `UnionInput`: Handles the specific logic for rendering union members, including the intelligent handling of `CSS_COLOR_NAME | RGB` types, potentially offering a combined input or a mechanism to switch input modes for different union members.

### 3. Data Flow
*   **Schema to Description:** The process begins with an `Effect.Schema` definition. This schema is passed to the `effectSchemaToFormDescription` module, which introspects its internal structure (AST) and generates a `FormFieldDescription` object.
*   **Description to UI:** The `FormFieldDescription` object is then passed to the `DynamicForm` React component. `DynamicForm` iterates through the description, and through recursive calls to `FormField`, dispatches rendering to the appropriate specific input components.
*   **User Input to State:** When a user interacts with an input field (e.g., types in a `StringInput`), the specific input component's internal `onChange` handler is triggered. This handler calls the `onValueChange` prop passed down from `FormField`, which in turn calls the `onValueChange` prop from `ObjectGroup` or `ArrayEditor` (if nested), eventually reaching the `handleFieldChange` method in `DynamicForm`, which updates the central `formData` state.

### 4. Extensibility
The modular architecture is designed for ease of extension:
*   **New Schema Types:** To support a new Effect Schema type or a specific combination, the `effectSchemaToFormDescription` module needs to be updated to recognize and process it into a new or existing `FormFieldDescription` type. A corresponding `case` (or dynamic lookup) would then be added to the `FormField` component's dispatch logic, pointing to a new or existing concrete input component.
*   **Custom Input Components:** To introduce a completely custom UI component for a specific `FormFieldDescription` type or `format` (e.g., a custom date picker for a branded `Date` schema), a new React component can be created in `src/components/inputs/`, and its usage registered in the `FormField` component's rendering logic.