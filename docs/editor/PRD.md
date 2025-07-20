# Product Requirements Document (PRD)

## Title: Effect Schema to React Form Editor

### 1. Introduction
*   **Purpose:** The primary purpose of this project is to create a robust and extensible solution for converting Effect Schemas into editable React forms, thereby maximizing the use of type information for intelligent UI layout and interaction.
*   **Background:** Manually developing forms for complex data structures is a time-consuming and error-prone process. Leveraging a schema-driven UI approach, as demonstrated by inspirations like `zod-to-fields`, can significantly streamline this by automatically generating form components from an authoritative schema definition.

### 2. Goals & Objectives
*   **Primary Goal:** To enable rapid and type-safe development of interactive web forms directly from Effect Schema definitions.
*   **Key Objectives:**
    *   **Automation:** Automatically generate intuitive and user-friendly form UI components from provided Effect Schemas.
    *   **Schema Coverage:** Support the conversion and rendering of core Effect Schema types, including structs (objects), arrays of complex types, unions, primitive types (string, number, boolean), literal types, and enums.
    *   **Intelligent Inputs:** Enhance the user experience by mapping specific string patterns (e.g., URL, email, CSS color name, RGB hex/value) to appropriate and specialized input components.
    *   **Structural Support:** Properly handle and render nested objects and dynamic arrays within the generated form structure.
    *   **Modularity & Extensibility:** Design the system with a modular architecture to ensure reusability of form components and ease of extension for future custom input types or schema features.

### 3. Scope (In-Scope for Initial Release)
*   **Core Conversion Functionality:**
    *   Development of a dedicated module (`effectSchemaToFormDescription`) responsible for introspecting an `Effect.Schema` object and converting it into a standardized `FormFieldDescription` data structure.
*   **React UI Generation:**
    *   Implementation of a `DynamicForm` React component to serve as the root of the generated form, managing overall state.
    *   Implementation of a recursive `FormField` React component to dispatch rendering to specific input components based on the `FormFieldDescription` type.
    *   Development of specific React input components for:
        *   `S.string`, `S.number`, `S.boolean` (standard HTML inputs).
        *   `S.literal` (read-only display).
        *   `S.enum` (select dropdown).
        *   `S.struct` (rendered as visually grouped properties/sections, e.g., using `fieldset`).
        *   `S.array` of complex types (with basic add/remove item functionality).
        *   `S.union`, with specific intelligent handling for `CSS_COLOR_NAME | RGB` types, allowing for unified input or a simple toggle between input modes.
*   **Type-Specific Input Mapping:**
    *   Detection and mapping of `S.string` schemas with common formats like `email` and `url` to corresponding HTML input types (`type="email"`, `type="url"`).
*   **State Management:**
    *   Basic local form state management within the `DynamicForm` component using React's `useState` and immutable updates.
*   **Styling:**
    *   Integration with Tailwind CSS for consistent and rapid UI styling.
*   **Environment:**
    *   Web application targeting modern browsers.

### 4. Out of Scope (For Initial Release)
*   **Advanced Schema Features:**
    *   Support for recursive schemas (self-referencing types).
    *   Direct integration or reflection of complex Effect `pipe` transformations or advanced validation rules (e.g., real-time feedback, custom asynchronous validation) within the UI. The output `FormFieldDescription` will not include detailed validation rules beyond `isRequired`.
*   **Complex UI Layouts:**
    *   Generation of highly specialized UI patterns like tabbed interfaces for very large schemas.
*   **Highly Custom Inputs:**
    *   Automatic generation of custom React components for arbitrary branded Effect types beyond the specified `email`, `url`, and color formats.
*   **Advanced Form Libraries:**
    *   Direct integration with external React form management libraries (e.g., React Hook Form, Formik). This can be a future enhancement once the core generation logic is stable.
*   **Accessibility (A11y):**
    *   Comprehensive accessibility considerations beyond basic semantic HTML elements. This will be an iterative improvement.
*   **Internationalization (i18n):**
    *   Support for multiple languages in labels or descriptions.
*   **Data Persistence:**
    *   Any backend integration, API calls, or data persistence mechanisms. The project focuses solely on frontend form generation and local state management.

### 5. User Experience & Design Considerations
*   **Intuitive Input Types:** Each schema type should map to the most intuitive and standard UI control (e.g., text fields for strings, number inputs for numbers, checkboxes for booleans, dropdowns for enums).
*   **Structured Layout:** Object schemas (`S.struct`) should be presented with clear visual grouping (e.g., using `fieldset` or bordered containers) to indicate hierarchical relationships.
*   **Dynamic List Management:** Array fields must provide clear and easy-to-use controls for adding new items and removing existing ones.
*   **Union Flexibility:** The `CSS_COLOR_NAME | RGB` union should offer a seamless user experience, potentially using a single input that intelligently handles both formats or a clear mechanism to switch between input modes.
*   **Clarity:** Field labels should be derived from schema property names by default, with support for custom, more user-friendly labels and optional descriptive tooltips.
*   **Required Indicators:** Required fields must be clearly marked (e.g., with an asterisk) to guide the user.