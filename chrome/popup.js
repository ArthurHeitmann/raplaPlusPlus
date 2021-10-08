// chrome/popup.ts
var input = document.querySelector("input");
input.oninput = () => chrome.storage.local.set({ enabled: input.checked });
chrome.storage.local.get("enabled", ({ enabled }) => input.checked = enabled);
