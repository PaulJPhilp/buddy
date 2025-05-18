"use client";

export default function ChatPage() {
  return (
    <div style={{
      width: "400px",
      height: "600px",
      border: "1px solid #ccc",
      margin: "20px auto",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "white"
    }}>
      <div style={{
        height: "56px",
        borderBottom: "1px solid #ccc",
        padding: "0 16px",
        display: "flex",
        alignItems: "center"
      }}>
        <div style={{width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "teal"}} />
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{display: "flex", justifyContent: "flex-start"}}>
          <div style={{borderRadius: "8px", padding: "12px", maxWidth: "80%", backgroundColor: "#f3f4f6"}}>
            <p style={{color: "#1f2937"}}>Hi! How can I help you today?</p>
            <span style={{fontSize: "12px", color: "#6b7280"}}>Assistant • Just now</span>
          </div>
        </div>
      </div>

      <div style={{
        borderTop: "1px solid #ccc",
        padding: "16px"
      }}>
        <div style={{display: "flex", gap: "8px"}}>
          <input 
            type="text" 
            placeholder="Type your message..." 
            style={{
              flex: 1,
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              padding: "8px 16px"
            }}
          />
          <button style={{
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px"
          }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
