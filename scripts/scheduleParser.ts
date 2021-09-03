import {$class, $classAr} from "./utils.js";

export interface WeekSchedule {
	days: WeekDay[];
	allBlocks: ScheduleBlock[]
}

export interface WeekDay {
	day: number,
	month: number,
	blocks: ScheduleBlock[]
}

export interface ScheduleBlock {
	startMinutes: number,
	endMinutes: number,
	title: string,
	people: string,
	other: string[],
	scheduleIndex: number
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
		allBlocks: []
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
		schedule.days[weekDayIndex].blocks.push(<ScheduleBlock> {
			startMinutes,
			endMinutes,
			title,
			people,
			other,
			scheduleIndex: null,
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
		}
	}

	// schedule.allBlocks = schedule.days.map(day => day.blocks).flat();
	// for (const day of schedule.days) {
	// 	for (const block of day.blocks)
	// 		block.allBlocksIndex = schedule.allBlocks.findIndex(b => block === b);
	// }

	return schedule;
}

function getWeekDayIndex(td: HTMLElement, dayColumnStartEnd: [number, number][]): number {
	const column = [...td.parentElement.children].findIndex(childTd => childTd === td);
	return dayColumnStartEnd.findIndex(startEnd => column >= startEnd[0] && column < startEnd[1]);
}
