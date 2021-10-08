import {main} from "../scripts/common/main.js";

let isReady = false;

browser.storage.local.get("enabled").then(({ enabled }) => {
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

browser.storage.onChanged.addListener((changes) => {
	if ("enabled" in changes) {
		if (changes.enabled.newValue)
			main();
		else
			location.reload();
	}
})
