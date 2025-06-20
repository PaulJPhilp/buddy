# Dynamic Workspace UI – Implementation Plan (v3)

> Last updated: 2025-06-16

This document reflects the agreed sequence of work after the latest discussion.  **Chat-app–level enhancements come first**, followed by the **Tabs** feature, then persistence/testing, and only afterwards the broader AppShell redesign.

---

## Phase 2 — Chat-App UI Enhancements (⚙ CURRENT)

| Item | Deliverable | Notes |
|------|-------------|-------|
| 2.1 | **HeaderBar “Clear chat” control** | Add small 🧹/trash icon button in `HeaderBar` for Compact & Expanded views. Hidden in Stashed & Closed.  New `onClearChat` callback passes `chatAppId` upward; handler empties message history. |
| 2.2 | **Empty-history placeholder** | When a chat-app's message list is empty (after clear) & not typing/rendering, `ChatArea` renders a friendly placeholder (icon + text). |
| 2.3 | **Playwright coverage** | Spec matrix: Compact → Clear, Expanded → Clear, Stashed→Restore→Clear. Verify placeholder, and that message count resets to 0. |

### Out of scope for Phase 2
* Tabs bar / AppShell
* Drag-and-drop ordering
* Theme inheritance refactor

---

## Phase 3 — Tabs Feature

| Item | Deliverable | Notes |
|------|-------------|-------|
| 3.1 | **Tab Bar UI** | Horizontal strip with tab pills + "＋" button.  Each pill shows name + optional color indicator. Active tab highlighted. |
| 3.2 | **Tab Events** | Wire `TAB_ADDED`, `TAB_ACTIVATED`, `TAB_CLOSED` to workspace store. |
| 3.3 | **Rendering Logic** | Only chat-apps whose `tabId` matches `activeTabId` are mounted. |
| 3.4 | **Keyboard Shortcuts** *(stretch)* | ⌘⇧[ / ⌘⇧] to cycle tabs. |
| 3.5 | **Playwright E2E** | Create two tabs, switch back and forth, confirm correct chat-app visibility. |

---

## Phase 4 — State Persistence & Hydration
* Serialize full `UIState` (tabs etc.) into `localStorage` on each transition (no special handling for cleared – messages array persisted as-is).
* `createUIActor` hydrates from storage on load.
* Unit tests for (de)serialization.

## Phase 5 — E2E Test Infrastructure
* Shared Playwright fixtures, server spin-up, flake-proof helpers.
* CI workflow parallelisation.

## Phase 6 — AppShell / Global Layout Redesign (future)
* Design spike + Architecture Design Document.
* Implementation tracked separately once design approved.

---

### Immediate next step
No further code changes until Phase 2 scope is approved. When approved, we will:
1. Implement HeaderBar "Clear" button + placeholder.
2. Add Playwright spec. 