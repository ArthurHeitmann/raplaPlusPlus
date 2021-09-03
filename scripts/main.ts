import {getWeekSchedule} from "./scheduleParser.js";
import {$id, makeElement, minutesToTimeStr, nDigitNumber} from "./utils.js";

const dayStartMinutes = 60 * 8;
const minuteIntervals = 60;
const dayDurationMinutes = 60 * 10;

function main() {
	const weekSchedule = getWeekSchedule();
	console.log(weekSchedule)

	$id("calendar").style.display = "none";

	document.body.append(
		makeElement("div", { class: "newCalendar" }, [
			// makeElement("div", { class: "left" }, [
			// 	makeElement("div", { class: "corner" }, [
			// 		makeElement("div", { class: "title" }, "Filter"),
			// 		makeElement("div", { class: "filterWrapper" }, [
			// 			makeElement("input", { type: "text" })
			// 		])
			// 	]),
			// 	makeElement("div", { class: "allBlocksList" },
			// 		weekSchedule.allBlocks.map(block => makeElement("div", { class: "block" }, [
			// 			makeElement("div", { class: "title" }, block.title),
			// 			makeElement("div", { class: "line" }, [
			// 				makeElement("div", { class: "time" }, `${minutesToTimeStr(block.startMinutes)} - ${minutesToTimeStr(block.endMinutes)}`),
			// 				block.people && makeElement("div", { class: "people" }, `${block.people}`)
			// 			]),
			// 			...block.other.map(other => makeElement("div", { class: "other expandedOnly" }, other))
			// 		]))
			// 	)
			// ]),
			makeElement("div", { class: "center" }, weekSchedule.days.map(day =>
				makeElement("div", { class: "day" }, [
					makeElement("div", { class: "header" }, [
						makeElement("div", { class: "dayTitle" }, `${nDigitNumber(day.day)}.${nDigitNumber(day.month)}.`),
						makeElement("div", { class: "hours" },
							Array(Math.floor(dayDurationMinutes / minuteIntervals)).fill(null)
								.map((_, i) => (dayStartMinutes + i * minuteIntervals) / 60)
								.map(hour => makeElement("div", { class: "hour" }, hour.toString()))
						)
					]),
					makeElement("div", { class: "blocks", style: `--max-slots: ${weekSchedule.maxSlots}` }, day.blocks.map(block =>
						makeElement("div", {
							class: `block ${block.colorScheme}`,
							style: `--start-minutes: ${(block.startMinutes - dayStartMinutes)}; --minutes: ${block.endMinutes - block.startMinutes}; --index: ${block.scheduleIndex}`,
							onclick: toggleBlock
						}, [
							makeElement("div", { class: "title" }, block.title),
							makeElement("div", { class: "time" }, `${minutesToTimeStr(block.startMinutes)} - ${minutesToTimeStr(block.endMinutes)}`),
							block.people && makeElement("div", { class: "people expandedOnly" }, `${block.people}`),
							...block.other.map(other => makeElement("div", { class: "other expandedOnly" }, other)),
							makeSvgArrow()
						])
					))
				])
			))
		])
	);
}
main();

function toggleBlock(this: HTMLElement) {
	if (this.classList.contains("expanded")) {
		this.classList.remove("expanded");
		this.style.removeProperty("max-height");
		this.style.removeProperty("min-height");
	}
	else {
		this.classList.add("expanded");
		this.style.minHeight = `${Math.max(this.offsetHeight, this.scrollHeight) + 8}px`;
		this.style.maxHeight = `${Math.max(this.offsetHeight, this.scrollHeight) + 8}px`;
	}
}

function makeSvgArrow(): Element {
	const dummy = document.createElement("div");
	dummy.innerHTML = `<svg class="downArrow" xmlns="http://www.w3.org/2000/svg" data-name="Layer 2" viewBox="0 0 48 48" x="0px" y="0px"><title>video music player</title><path d="M24,31a2,2,0,0,1-1.41-.59l-10-10a2,2,0,0,1,2.82-2.82L24,26.17l8.59-8.58a2,2,0,0,1,2.82,2.82l-10,10A2,2,0,0,1,24,31Z"></path></svg>`;
	return dummy.children[0];
}


