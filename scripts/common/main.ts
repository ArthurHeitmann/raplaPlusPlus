import {getWeekSchedule, WeekSchedule} from "./scheduleParser";
import {$css, $id, makeElement, minutesToTimeStr, nDigitNumber} from "./utils";
import {dragOnMouseDown, dragOnMouseMove, dragOnMouseUp} from "./dragger";

let weekSchedule: WeekSchedule;
let timeMarker: HTMLElement;
let mainExecuted = false;

export function main() {
	if (mainExecuted)
		return;
	mainExecuted = true;

	weekSchedule = getWeekSchedule();

	document.head.insertAdjacentHTML("beforeend", `<meta content="width=device-width, initial-scale=1" name="viewport" />`)
	document.head.insertAdjacentHTML("beforeend", `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">`)
	$id("calendar").remove();
	rearrangeHeader();

	document.body.append(
		makeElement("div", { class: "newCalendar" }, [
			timeMarker = makeElement("div", { class: "timeMarker hide" }),
			makeElement("div", { class: "center" }, weekSchedule.days.map(day =>
				makeElement("div", { class: "day", style: `--dayLengthInMinutes: ${(day.endHour - day.startHour) * 60}` }, [
					makeElement("div", { class: "header" }, [
						makeElement("div", { class: "dayTitle" }, `${day.dayName} ${nDigitNumber(day.day)}.${nDigitNumber(day.month)}.`),
						makeElement("div", { class: "hours" },
							Array(day.endHour - day.startHour).fill(null)
								.map((_, i) => day.startHour + i)
								.map(hour => makeElement("div", { class: "hour" }, hour.toString()))
						)
					]),
					makeElement("div", { class: "blocks", style: `--max-slots: ${weekSchedule.maxSlots}` }, day.blocks.map(block =>
						makeElement("div", {
							class: `block ${block.colorScheme}`,
							style: `--start-minutes: ${(block.startMinutes - day.startHour * 60)}; --minutes: ${block.endMinutes - block.startMinutes}; --index: ${block.scheduleIndex}`,
							onclick: toggleBlock
						}, [
							makeElement("div", { class: "title" }, block.title),
							makeElement("div", { class: "time" }, `${minutesToTimeStr(block.startMinutes)} - ${minutesToTimeStr(block.endMinutes)}`),
							block.location && makeElement("div", { class: "location" }, `${block.location}`),
							block.people && makeElement("div", { class: "people expandedOnly" }, `${block.people}`),
							...block.other.map(other => makeElement("div", { class: "other expandedOnly" }, other)),
							makeSvgArrow()
						])
					))
				])
			)),
		])
	);
	updateTimeMarker();
	setInterval(updateTimeMarker, 1000);

	window.addEventListener("mousedown", dragOnMouseDown);
	window.addEventListener("mouseup", dragOnMouseUp);
	window.addEventListener("mousemove", dragOnMouseMove);
}

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

function updateTimeMarker() {
	const nowDate = new Date();
	const dayColumn = weekSchedule.days.findIndex(day => day.day === nowDate.getDate())
	const todayData = weekSchedule.days[dayColumn];
	let dayStartMinutes = todayData?.startHour * 60;
	let dayDurationMinutes = (todayData?.endHour - todayData?.startHour) * 60;
	if (dayColumn === -1 ||
		todayData.month !== nowDate.getMonth() + 1 ||
		nowDate.getHours() * 60 < dayStartMinutes || nowDate.getHours() * 60 >= dayStartMinutes + dayDurationMinutes
	) {
		timeMarker.classList.add("hide");
		return;
	}
	if (timeMarker.classList.contains("hide")) {
		timeMarker.classList.remove("hide");
		const dayElement = $css(".center > .day")[dayColumn];
		const bounds = dayElement.getBoundingClientRect();
		if (bounds.left < 0 || bounds.right > window.innerHeight)
			document.body.scrollBy({ left: bounds.left - 100 });
	}
	const previousDaysMinutes = weekSchedule.days
		.slice(0, dayColumn)
		.reduce((prev, curr) => prev + (curr.endHour - curr.startHour), 0)
		* 60;
	timeMarker.style.setProperty("--minutes", (
		previousDaysMinutes + (nowDate.getHours() - todayData.startHour) * 60 + nowDate.getMinutes()
		).toString());
}

let downArrowSvg: Element;
function makeSvgArrow(): Element {
	if (!downArrowSvg) {
		const dummy = document.createElement("div");
		dummy.innerHTML = `<svg class="downArrow" xmlns="http://www.w3.org/2000/svg" data-name="Layer 2" viewBox="0 0 48 48" x="0px" y="0px"><title>video music player</title><path d="M24,31a2,2,0,0,1-1.41-.59l-10-10a2,2,0,0,1,2.82-2.82L24,26.17l8.59-8.58a2,2,0,0,1,2.82,2.82l-10,10A2,2,0,0,1,24,31Z"></path></svg>`;
		downArrowSvg = dummy.children[0];
	}
	return downArrowSvg.cloneNode(true) as Element;
}


