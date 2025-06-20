# Chat-App Operations – UI Design

> Version 0.1 (2025-06-16)

This document specifies how a **single chat-app instance** presents and handles the five core operations defined in the PRD:

| Operation | Command | Visible In | Control Placement | Icon / Label | Behaviour |
|-----------|---------|-----------|-------------------|--------------|-----------|
| Clear history | *internal* | Compact, Expanded | Right-side of `HeaderBar` | 🧹 or trash-can, tooltip "Clear chat" | Empties the message list while keeping current display state. |
| Expand | `CHAT_APP_EXPANDED` | Compact | Left-click anywhere on chat-app body **or** dedicated ↗︎ button in header | ↗︎ "Expand" | App becomes full-width/height; all sibling apps in same tab become `stashed`. |
| Compact (from Expanded) | `CHAT_APP_COMPACTED` | Expanded | ↘︎ button in header | ↘︎ "Restore" | Returns to Compact; previously stashed apps also compacted. |
| Stash | implicit via `CHAT_APP_EXPANDED` (affects others) | n/a | n/a | n/a | Non-focused apps auto-stash when another is expanded; they render as pills. |
| Un-stash | `CHAT_APP_COMPACTED` | Stashed pill | Click pill | n/a (pill shows app name/color) | Selected pill becomes Compact; previously Expanded becomes Compact. |
| Close | `CHAT_APP_CLOSED` | Compact, Expanded | × button in header, left-most | × "Close chat" | Sets status `closed`; chat-app unmounts until reopened via external UI (future). |

## Visual Composition

### 1. HeaderBar (Compact & Expanded)
```
┌──────────────────────────────────────────────────────────┐
│ [≡ icon]  Chat Name           (status)     🧹  ↗︎  × │
└──────────────────────────────────────────────────────────┘
```
* **Icon ordering (RTL):** Clear • Expand/Restore • Close. 
* Buttons are `Button variant="ghost" size="icon"` with zero chrome until hover/focus to avoid clutter.  Tooltip on hover.
* HeaderBar already has status-toggle chevron; operation icons sit to the RIGHT of that chevron.

### 2. Stashed Pill
```
╭── Chat Name ╮
│  (color)   │   ← clicking fires `CHAT_APP_COMPACTED`
╰────────────╯
```
* Size ≈ 56 × 20 px, background uses the tab's color (or theme fallback).  On hover pill raises (`translate-y-1`) to suggest action.

### 3. Empty Placeholder (in ChatArea)
```
      (Inbox icon 48px, opacity 40%)
      No messages yet. Start the conversation.
```
Centered flex column; text `text-muted-foreground`, icon color `var(--color-chat-primary)` at 40 % opacity.

## Interaction Details
* All buttons emit **only** the event object; view logic remains declarative.
* Keyboard: while Expanded, **Esc** triggers `CHAT_APP_COMPACTED`.
* Focus order: Close > Expand/Restore > Clear to ensure destructive action is not first in tab sequence.

## Accessibility
* Tooltip content is mirrored in `aria-label`.  Events are announced via `aria-live="polite"` region where we already log system messages.

---

### Open Questions
1. Do we need an "Are you sure?" confirmation for Close or Clear? (Not in current PRD.)
2. Should a stashed pill show unread indicator if new messages arrive while stashed?  (Future enhancement.)

---

End of v0.1 