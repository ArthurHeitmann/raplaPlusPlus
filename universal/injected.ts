import {main} from "../scripts/common/main";


function inject() {
	const style = ``;
	document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`)
	main();
}

if (["complete", "interactive"].includes(document.readyState))
	inject();
else {
	document.addEventListener("readystatechange", () => {
		if (document.readyState !== "interactive")
			return;
		inject();
	});
}

