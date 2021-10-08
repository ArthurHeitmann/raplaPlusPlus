import {classInElementTree} from "./utils";

let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let isDragging = false;
let dragStart = 0;
let isSelectionDisabled = false;

export function dragOnMouseDown(e: MouseEvent) {
	if (classInElementTree(e.target as Element, "block"))
		return;
	if (!classInElementTree(e.target as Element, "newCalendar"))
		return;
	startX = e.screenX;
	startY = e.screenY;
	lastX = e.screenX;
	lastY = e.screenY;
	isDragging = true;
	dragStart = Date.now();
	isSelectionDisabled = false;
}

export function dragOnMouseUp() {
	isDragging = false;
	document.body.classList.remove("isDragging");
}

export function dragOnMouseMove(e: MouseEvent) {
	if (!isDragging)
		return;
	const deltaX = (lastX - e.screenX) / (devicePixelRatio || 1);
	const deltaY = (lastY - e.screenY) / (devicePixelRatio || 1);
	document.body.scrollBy(deltaX, deltaY);
	lastX = e.screenX;
	lastY = e.screenY;
	const startDeltaX = startX - e.screenX;
	const startDeltaY = startY - e.screenY;
	if (!isSelectionDisabled && Math.abs(startDeltaX + startDeltaY) > 5) {
		document.body.classList.add("isDragging");
		isSelectionDisabled = true;
	}
}