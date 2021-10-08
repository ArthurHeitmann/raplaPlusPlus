import {$class, $classAr} from "./utils.js";

export interface WeekSchedule {
	days: WeekDay[];
	allBlocks: ScheduleBlock[],
	maxSlots: number
}

export interface WeekDay {
	day: number,
	month: number,
	dayName: string,
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
	// column width/spawn of each week day
	const dayColumnStartEnd: [number, number][] = [];
	const dayColSpans: number[] = weekDayHeaders
		.map(td => parseInt(td.getAttribute("colspan") ?? "1"));
	for (let i = 0; i < dayColSpans.length; i++) {
		const previous = i > 0 ? dayColumnStartEnd[i - 1][1] : 1;
		dayColumnStartEnd.push([previous, previous + dayColSpans[i]]);
	}

	const schedule: WeekSchedule = {
		days: weekDayHeaders.map(td => (<WeekDay>{
			dayName: td.innerText.match(/(\w+) \d+\.\d+\./)[1],
			day: parseInt(td.innerText.match(/\w+ (\d+)\.\d+\./)[1]),
			month: parseInt(td.innerText.match(/\w+ \d+\.(\d+)\./)[1]),
			blocks: []
		})),
		allBlocks: [],
		maxSlots: null
	};

	const tableElement = $class("week_table")[0] as HTMLTableElement;
	// get table dimensions (complicated due to row- & colspan)
	let tableRows = 0;
	let tableColumns = 0;
	for (const row of tableElement.rows) {
		let rowHeight = 1;
		let rowWidth = 0;
		for (const cell of row.cells) {
			rowHeight = Math.min(rowHeight, getCellSpan(cell, "rowspan"));
			rowWidth += getCellSpan(cell, "colspan");
		}
		tableRows += rowHeight;
		tableColumns = Math.max(tableColumns, rowWidth);
	}

	// all cell marked as true have been iterated over by the following loop
	const virtualTable: boolean[][] = Array(tableRows).fill(null).map(() => Array(tableColumns).fill(false));

	let y = 0;
	for (const row of tableElement.rows) {
		let x = 0;
		let rowHeight = 1;
		for (const cell of row.cells) {
			// update virtual table and x & y
			if (virtualTable[y][x])
				x++;
			const cellRowSpan = getCellSpan(cell, "rowspan");
			const cellColSpan = getCellSpan(cell, "colspan");
			for (let cellY = y; cellY < Math.min(y + cellRowSpan, tableRows); cellY++) {
				for (let cellX = x; cellX < Math.min(x + cellColSpan, tableColumns); cellX++)
					virtualTable[cellY][cellX] = true;
			}
			rowHeight = Math.min(rowHeight, cellRowSpan);
			x++;
			if (!cell.classList.contains("week_block"))
				continue;
			// add schedule block data
			const linkNode = cell.$css("a .link")[0] ?? cell.$tag("a")[0]
			const textNodes = [...linkNode.childNodes].filter(n => n.nodeType === Node.TEXT_NODE);
			const timeAndTitleMatches = textNodes[0].textContent.match(/(\d\d):(\d\d)\s*-\s*(\d\d):(\d\d)/);
			const weekDayIndex = getWeekDayIndex(x, dayColumnStartEnd);
			schedule.days[weekDayIndex].blocks.push(<ScheduleBlock>{
				startMinutes: parseInt(timeAndTitleMatches[1]) * 60 + parseInt(timeAndTitleMatches[2]),
				endMinutes: parseInt(timeAndTitleMatches[3]) * 60 + parseInt(timeAndTitleMatches[4]),
				title: textNodes[1].textContent.replace(/\s+/g, " "),
				people: (cell.getElementsByClassName("person")[0] as HTMLElement)?.innerText ?? "",
				other: cell.$classAr("resource").map(res => res.innerText),
				scheduleIndex: null,
				colorScheme: colorMap[cell.style.getPropertyValue("background-color")] ?? "default"
			});
		}
		for (let i = 0; i < rowHeight; i++)
			y++;
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

function getCellSpan(cell: HTMLElement, type: "colspan" | "rowspan"): number {
	return  parseInt(cell.getAttribute(type) ?? "1");
}

function getWeekDayIndex(x: number, dayColumnStartEnd: [number, number][]): number {
	return dayColumnStartEnd.findIndex(startEnd => x >= startEnd[0] && x < startEnd[1]);
}
