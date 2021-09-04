import {getWeekSchedule} from "./scheduleParser.js";
import {$css, $id, makeElement, minutesToTimeStr, nDigitNumber} from "./utils.js";
import {dragOnMouseDown, dragOnMouseMove, dragOnMouseUp} from "./dragger.js";

const dayStartMinutes = 60 * 8;
const minuteIntervals = 60;
const dayDurationMinutes = 60 * 10;

function main() {
	const weekSchedule = getWeekSchedule();
	console.log(weekSchedule)

	document.head.insertAdjacentHTML("beforeend", `<meta content="width=device-width, initial-scale=1" name="viewport" />`)
	$id("calendar").remove();
	rearrangeHeader();

	document.body.append(
		makeElement("div", { class: "newCalendar" }, [
			makeElement("div", { class: "center" }, weekSchedule.days.map(day =>
				makeElement("div", { class: "day" }, [
					makeElement("div", { class: "header" }, [
						makeElement("div", { class: "dayTitle" }, `${day.dayName} ${nDigitNumber(day.day)}.${nDigitNumber(day.month)}.`),
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
	window.addEventListener("mousedown", dragOnMouseDown);
	window.addEventListener("mouseup", dragOnMouseUp);
	window.addEventListener("mousemove", dragOnMouseMove);
}
main();

function rearrangeHeader() {
	const title = $css("h2.title")[0];
	const form = $css(".datechooser > form")[0];
	const prevBtn = $css("input[type=submit][name=prev]")[0];
	const nextBtn = $css("input[type=submit][name=next]")[0];
	const todayBtn = $css("input[type=submit][name=today]")[0];
	const showDateBtn = $css("input[type=submit][name=goto]")[0];
	const hiddenInputs = $css("input[type=hidden]");
	const selects = $css("select[name]");

	$css(".datechooser")[0].remove();
	form.innerText = "";
	form.append(...hiddenInputs, prevBtn, todayBtn, ...selects, showDateBtn, nextBtn);

	const newHeader = makeElement("div", { class: "newHeader" }, [
		title, form
	]);
	document.body.insertAdjacentElement("afterbegin", newHeader);
}

function toggleBlock(this: HTMLElement) {
	if (this.classList.contains("expanded")) {
		if (document.getSelection().toString())
			return;
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


