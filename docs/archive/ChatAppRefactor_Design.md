# ChatApp Refactor - Design Document

## 1. Introduction

This document outlines the design for refactoring the `ChatApp` into its main constituent components: `Header`, `ChatArea`, and `UserArea`. The goals are to improve modularity, maintainability, and enable shared, configurable styling. A reusable `ToolBar` component will also be created.

## 2. Core Components

The `ChatApp` will be decomposed into the following primary components:

### 2.1. `Header` Component
- **Responsibilities**:
    - Display the application name.
    - Indicate error states (e.g., via a clickable icon revealing details).
    - Visually reflect when the chat app instance is active/selected (e.g., border/background color changes).
    - Optionally display a slidedown panel for status information (triggered by an icon), which can show details like token/cost usage or agent status.
- **Key Props (Conceptual)**:
    - `appName`: string
    - `errorInfo?`: object (details for error display)
    - `isSelected?`: boolean
    - `statusInfo?`: object (for slidedown panel)
    - `onToggleStatusPanel?`: () => void
    - Styling props (see Section 4).

### 2.2. `ChatArea` Component
- **Responsibilities**:
    - Display the main stream of chat messages (static text, streaming text, agent activity indicators like "thinking...").
    - Show "user is typing..." indicators.
    - Display timestamps for messages.
    - Render different message types (text, images, files, system messages).
    - Show loading indicators when fetching older messages.
    - Provide a button to scroll to the latest message.
    - **Assistant Message Toolbar**:
        - Appears beneath assistant messages (if enabled for the chat app).
        - Always visible (when enabled).
        - Contains configurable actions (e.g., thumbs up/down, copy, read aloud, branch). Configuration can vary per message type.
        - Uses the reusable `ToolBar` component.
- **Key Props (Conceptual)**:
    - `messages`: Message[]
    - `isLoadingHistory?`: boolean
    - `typingUsers?`: User[]
    - `onLoadMoreMessages?`: () => void
    - `assistantMessageToolbarConfig`: (message: Message) => ToolBarItem[] // Function to get toolbar items for a message
    - Styling props.

### 2.3. `UserArea` Component
- **Responsibilities**: Manages user input and interaction with agents/characters. Optionally structured in three rows.
- **Sub-components/Rows**:
    1.  **`AttachmentBar` (Optional)**:
        - Displays currently attached files (filename, icon, size, remove option).
        - Files are added via an action in the `MinimalInput`'s toolbar.
    2.  **`MinimalInput`**:
        - The primary text input field for the user.
        - Contains an **embedded `ToolBar`** with actions like:
            - Dashboard for token/cost info.
            - Paperclip icon to add attachments.
            - Send message icon.
    3.  **`AgentToolBar` (Optional)**:
        - Used for controlling and interacting with the selected agent/character.
        - Contains an **agent selection mechanism** (initially a select box) as its leftmost element.
        - Displays agent-specific controls (e.g., Start, Stop, Pause, Inspect, Restart). These controls are fixed per agent type.
        - Uses the reusable `ToolBar` component.
- **Key Props (Conceptual)**:
    - `onSendMessage`: (text: string, attachments: File[]) => void
    - `availableAgents`: Agent[]
    - `selectedAgentId?`: string
    - `onSelectAgent`: (agentId: string) => void
    - `currentAttachments`: File[]
    - `onRemoveAttachment`: (fileId: string) => void
    - `minimalInputToolbarConfig`: ToolBarItem[]
    - `agentToolbarConfig`: (agent: Agent) => ToolBarItem[]
    - Styling props.

## 3. Reusable `ToolBar` Component

- **Purpose**: A generic component to display a sequence of interactive commands (icon and/or label with an action).
- **Props (`ToolBarProps`)**:
    - `commands: ToolBarItem[]`: An array of items to display. Each item can be:
        - `ToolBarCommand`: An object defining an interactive command.
        - `ToolBarSpacer`: An object defining a flexible spacer.
        - `null`: Represents an empty slot.
    - `variant?: string`: A key (e.g., 'default', 'compact', 'tiny') to select a predefined style configuration.
    - `className?: string`: Additional CSS classes for the toolbar container.
    - `ariaLabel?: string`: Accessibility label for the toolbar.
- **Item Types (`ToolBarItem`)**:
    - **`ToolBarCommand`**:
        - `id: string`
        - `icon: React.ReactNode`
        - `label?: string` (optional text label)
        - `action: () => void`
        - `tooltip?: string` (optional)
        - `disabled?: boolean` (optional)
    - **`ToolBarSpacer`**:
        - `id: string`
        - `type: 'spacer-expand'` (renders an element that grows to fill space, e.g., `flex-grow: 1`)
- **Layout**: Achieved by the order of items in the `commands` array, using `ToolBarSpacer` items to create flexible layouts (e.g., left/center/right alignment within a single flex row).

## 4. Styling Strategy

- **Global Color Theme**:
    - Components like `Header`, `ChatArea`, `UserArea` (and `ToolBar` indirectly) will accept shared styling props like `primaryColor`, `secondaryColor`, `activePrimaryColor`, `activeSecondaryColor`.
    - These props will determine the base colors for elements within the components.
- **Named Style Configurations (`variant` prop)**:
    - Components (especially `ToolBar`, but potentially others) will have a `variant` prop (e.g., `variant="tiny"`).
    - This `variant` string is a key to look up a JavaScript object containing a collection of style properties (primarily Tailwind CSS classes).
    - **Definition**: These style configuration objects (e.g., `toolbarVariantStyles`) will be defined in JS/TS files (e.g., `toolbar.styles.ts`).
        - Example: `toolbarVariantStyles.tiny = { iconSizeClasses: "h-4 w-4", itemPaddingClasses: "p-1", ... }`.
    - **Application**: The component internally uses these class strings from the selected variant object to apply styles.
    - **Composition**: Variants primarily control size, spacing, and potentially some structural styling. They should compose with the global color theme props.
- **Technology**: Styling will heavily leverage Tailwind CSS v4.1.3+.
