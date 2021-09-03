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
			makeElement("div", { class: "left" }, [
				makeElement("div", { class: "corner" }, [
					makeElement("div", { class: "title" }, "Filter"),
					makeElement("div", { class: "filterWrapper" }, [
						makeElement("input", { type: "text" })
					])
				]),
				makeElement("div", { class: "allBlocksList" },
					weekSchedule.allBlocks.map(block => makeElement("div", { class: "block" }, [
						makeElement("div", { class: "title" }, block.title),
						makeElement("div", { class: "line" }, [
							makeElement("div", { class: "time" }, `${minutesToTimeStr(block.startMinutes)} - ${minutesToTimeStr(block.endMinutes)}`),
							block.people && makeElement("div", { class: "people" }, `${block.people}`)
						]),
						...block.other.map(other => makeElement("div", { class: "other expandedOnly" }, other))
					]))
				)
			]),
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
					makeElement("div", { class: "blocks" }, day.blocks.map(block =>
						makeElement("div", { class: "block", style: `--start-minutes: ${(block.startMinutes - dayStartMinutes)}; --minutes: ${block.endMinutes - block.startMinutes}; --index: ${block.scheduleIndex}` }, [
							makeElement("div", { class: "title" }, block.title),
							makeElement("div", { class: "time" }, `${minutesToTimeStr(block.startMinutes)} - ${minutesToTimeStr(block.endMinutes)}`),
							block.people && makeElement("div", { class: "people expandedOnly" }, `${block.people}`),
							...block.other.map(other => makeElement("div", { class: "other expandedOnly" }, other))
						])
					))
				])
			))
		])
	);
}

main();

