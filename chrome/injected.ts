import {main} from "../scripts/common/main";

let isReady = false;

chrome.storage.local.get("enabled", ({ enabled }) => {
	if (!enabled)
		return;
	if (isReady)
		main();
	else
		isReady = true;
});

document.addEventListener("readystatechange", () => {
	if (document.readyState !== "interactive")
		return;
	if (isReady)
		main();
	else
		isReady = true;
});

chrome.storage.onChanged.addListener((changes) => {
	if ("enabled" in changes) {
		if (changes.enabled.newValue)
			main();
		else
			location.reload();
	}
})