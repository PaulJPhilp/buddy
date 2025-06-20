# Page snapshot

```yaml
- region "Notifications alt+T"
- alert
- button "Open Next.js Dev Tools":
  - img
- toolbar "main-toolbar toolbar":
  - button "Toggle Sidebar"
- main:
  - region "Send/Receive Test Chat":
    - heading "Send/Receive Test Chat" [level=2]
    - button "Expand chat"
    - button "Close chat"
    - button "Settings"
    - button "Clear chat"
    - log:
      - paragraph: Hello, agent!
      - text: 4:58:00 AM
      - paragraph: Hello there! How can I assist you today?
      - text: 4:58:01 AM
    - textbox "Message input"
    - toolbar "Input actions toolbar":
      - button "Attach files"
      - button "Send message" [disabled]
    - combobox "Select agent": test-agent
```