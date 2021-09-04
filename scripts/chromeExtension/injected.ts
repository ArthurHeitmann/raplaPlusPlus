import {main} from "../common/main.js";

chrome.storage.sync.get("enabled", ({ enabled }) => {
	if (!enabled)
		return;
	if (document.body) {
		main();
	}
	else {
		new MutationObserver((mutations, observer) => {
			if (mutations.find(mutation => [...mutation.addedNodes].find(node => node.nodeName === "BODY"))) {
				main();
				observer.disconnect();
			}
		}).observe(document.documentElement, {childList: true});
	}
})

chrome.storage.onChanged.addListener((changes) => {
	if ("enabled" in changes) {
		if (changes.enabled.newValue)
			main();
		else
			location.reload();
	}
})