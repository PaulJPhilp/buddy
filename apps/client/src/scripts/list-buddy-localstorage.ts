// List all buddy:* keys and their contents from localStorage (browser only)
(function listBuddyLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    console.log(
      "This script must be run in the browser console (localStorage not available).",
    );
    return;
  }
  const keys = Object.keys(localStorage).filter((k) => k.startsWith("buddy:"));
  if (keys.length === 0) {
    console.log("No buddy:* keys found in localStorage.");
    return;
  }
  console.log("buddy:* keys in localStorage:\n");
  for (const key of keys) {
    const value = localStorage.getItem(key);
    let summary = value;
    if (value && value.length > 200) {
      summary = `${value.slice(0, 200)}... (truncated)`;
    }
    console.log(`- ${key}:\n${summary}\n`);
  }
})();
