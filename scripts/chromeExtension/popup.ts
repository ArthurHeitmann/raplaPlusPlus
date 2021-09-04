const input = document.querySelector("input");
input.oninput = () => chrome.storage.sync.set({ enabled: input.checked });
chrome.storage.sync.get("enabled", ({ enabled }) => input.checked = enabled);