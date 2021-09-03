import {$class, $classAr} from "./utils.js";

export interface WeekSchedule {
	days: WeekDay[];
	allBlocks: ScheduleBlock[],
	maxSlots: number
}

export interface WeekDay {
	day: number,
	month: number,
	blocks: ScheduleBlock[]
}

type Colors = "default" | "red" | "blueish" | "darkgray";

export interface ScheduleBlock {
	startMinutes: number,
	endMinutes: number,
	title: string,
	people: string,
	other: string[],
	scheduleIndex: number,
	colorScheme: Colors;
}

const colorMap: { [cssVal: string]: Colors } = {
	"rgb(238, 238, 238)": "default",
	"rgb(255, 0, 0)": "red",
	"rgb(192, 226, 255)": "blueish",
	"rgb(204, 204, 204)": "darkgray"
}

export function getWeekSchedule(): WeekSchedule {
	const weekDayHeaders = $classAr("week_header");
	const dayColumnStartEnd: [number, number][] = [];
	const dayColSpans: number[] = weekDayHeaders
		.map(td => parseInt(td.getAttribute("colspan") ?? "1"));
	for (let i = 0; i < dayColSpans.length; i++) {
		const previous = i > 0 ? dayColumnStartEnd[i - 1][1] : 0;
		dayColumnStartEnd.push([previous, previous + dayColSpans[i]]);
	}

	const schedule: WeekSchedule = {
		days: weekDayHeaders.map(td => (<WeekDay>{
			day: parseInt(td.innerText.match(/\w+ (\d+)\.\d+\./)[1]),
			month: parseInt(td.innerText.match(/\w+ \d+\.(\d+)\./)[1]),
			blocks: []
		})),
		allBlocks: [],
		maxSlots: null
	};

	for (const block of $class("week_block")) {
		const linkNode = block.$css("a .link")[0] ?? block.$tag("a")[0]
		const textNodes = [...linkNode.childNodes].filter(n => n.nodeType === Node.TEXT_NODE);
		const timeAndTitleMatches = textNodes[0].textContent.match(/(\d\d):(\d\d)\s*-\s*(\d\d):(\d\d)/);
		const startMinutes: number = parseInt(timeAndTitleMatches[1]) * 60 + parseInt(timeAndTitleMatches[2]);
		const endMinutes: number = parseInt(timeAndTitleMatches[3]) * 60 + parseInt(timeAndTitleMatches[4]);
		const title = textNodes[1].textContent.replace(/\s+/g, " ");
		const people = (block.getElementsByClassName("people")[0] as HTMLElement)?.innerText ?? "";
		const other: string[] = block.$classAr("resource").map(res => res.innerText);
		const weekDayIndex = getWeekDayIndex(block, dayColumnStartEnd);
		const colorScheme = colorMap[block.style.getPropertyValue("background-color")] ?? "default";
		schedule.days[weekDayIndex].blocks.push(<ScheduleBlock> {
			startMinutes,
			endMinutes,
			title,
			people,
			other,
			scheduleIndex: null,
			colorScheme
		});
	}


	for (const day of schedule.days) {
		for (const block of day.blocks) {
			let scheduleIndex = 0;
			// find time schedule index with no overlapping time ranges
			while (day.blocks.findIndex(b =>
				b.scheduleIndex === scheduleIndex &&											// same schedule slot
				(block.startMinutes <= b.endMinutes && block.endMinutes >= b.startMinutes)		// has overlap
			) !== -1) {
				scheduleIndex++;
			}
			block.scheduleIndex = scheduleIndex;
			schedule.maxSlots = Math.max(schedule.maxSlots, scheduleIndex);
		}
	}
	schedule.maxSlots++;

	return schedule;
}

function getWeekDayIndex(td: HTMLElement, dayColumnStartEnd: [number, number][]): number {
	const column = [...td.parentElement.children].findIndex(childTd => childTd === td);
	return dayColumnStartEnd.findIndex(startEnd => column >= startEnd[0] && column < startEnd[1]);
}
