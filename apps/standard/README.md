# Buddy Chat - Refactored

This is a refactored version of the Buddy Chat application that follows a cleaner, more modular structure.

## Project Structure

The project has been reorganized into:

1. **Standard App**: A clean implementation of the Buddy Chat using the AppShell, HeaderBar, and Sidebar components.
   - Located in `/apps/standard`
   - Uses simple React components without complex state management

2. **Core Components**:
   - `AppShell`: The main layout component that includes the sidebar and header
   - `HeaderBar`: The top navigation bar
   - `Sidebar`: The collapsible side navigation
   - `ChatApp`: The main chat interface
   - `MessageArea`: The area where messages are displayed
   - `UserArea`: The input area for user messages

3. **Archived and Removed Content**:
   - All variations, demos, and non-essential code has been moved to `/_archived`
   - The previous `apps/minimal` implementation has been archived and removed

## Getting Started

To run the standard app:

```bash
cd apps/standard
npm install
npm run dev
```

The app will start on port 3002.

## Application Modes

The app has two modes:

1. **Standard**: Uses the components defined directly in the app
2. **Enhanced**: Uses the components from the shared UI package

You can switch between these modes using the navigation buttons at the top of the app.

## Future Improvements

- Add real-time communication using WebSockets
- Implement authentication and user management
- Add persistence for chat history
