const input = document.querySelector("input");
input.oninput = () => browser.storage.local.set({ enabled: input.checked });
browser.storage.local.get("enabled").then(({ enabled }) => input.checked = enabled);